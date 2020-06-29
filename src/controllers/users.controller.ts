import {Request, Response} from "express";
import {connection} from "../database";
import { User } from "../models/User";
import {findUserById, findUserByIdBeautiful, saveMatchHistory, saveUser} from "../services/user.services";

export async function getUsers(req: Request, res: Response): Promise<Response> {
    const users = await connection.query("SELECT * FROM users");
    return res.json(users[0]);
}

export async function getUser(req: Request, res: Response) {
    const id = req.params.id;
    const user = await findUserById(id);
    return res.json(user)
}

export async function createUser(req: Request, res: Response) {
    await saveUser(req.body);
    return res.json({
        user: req.body
    })
}

export async function deleteUser(req: Request, res: Response) {
    const id = req.params.id;
    await connection.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({
        message: "User deleted"
    })
}

export async function updateUser(req: Request, res: Response) {
    const id = req.params.id;
    const updatedUser: User = req.body;
    await connection.query("UPDATE users SET ? WHERE id = ?", [updatedUser, id]);
    return res.json({
        message: "User updated"
    })
}

export async function getUsersWaiting(req: Request, res: Response): Promise<Response> {
    const users = await connection.query("SELECT * FROM users_waiting");
    return res.json(users[0]);
}

export async function deleteUserWaiting(req: Request, res: Response) {
    const user_id = req.params.id;
    await connection.query("DELETE FROM users_waiting WHERE user_id = ?", [user_id]);
    return res.json({
        message: "User deleted"
    })
}

export async function addUserWaiting(req: Request, res: Response) {
    const user_id = {user_id: req.body.id};
    try {
        await connection.query("INSERT INTO users_waiting SET ?", [user_id]);
    }catch (e) {
        console.log(e)
    }
    return res.json({
        message: "User added"
    })
}

export async function getMatchHistory(req: Request, res: Response) {
    const winner_id = req.params.winnerId;
    const loser_id = req.params.loserId;
    const history = await connection.query("SELECT * FROM match_history WHERE winner_id = ? AND loser_id = ?", [winner_id, loser_id]);
    return res.json(history[0]);
}

export async function addMatchHistory(req: Request, res: Response) {
    const winnerId = {winner_id: req.params.winnerId};
    const loserId = {loser_id: req.params.loserId};
    await saveMatchHistory(winnerId, loserId);
    return res.json({
        message: "Match history added"
    })
}

export async function getPlayerMatchHistory(req: Request, res: Response){
    const player_id = req.params.userId;
    const [winnerRows]: any[] = await connection.query("SELECT * FROM match_history WHERE winner_id = ?", [player_id]);
    const [loserRows]: any[] = await connection.query("SELECT * FROM match_history WHERE loser_id = ?", [player_id]);

    let beautifulWinnerRows: any[] = await Promise.all(winnerRows.map(async (row: any) => {
        return {
            user: await findUserByIdBeautiful(row.loser_id),
            date: row.date,
            won: true
        }
    }));

    let beautifulLoserRows: any[] = await Promise.all(loserRows.map(async (row: any) => {
        return {
            user: await findUserByIdBeautiful(row.winner_id),
            date: row.date,
            won: false
        }
    }));

    let result: any[] =  [...beautifulWinnerRows, ...beautifulLoserRows].sort((row1: any, row2: any) => {
        return row1.date - row2.date
    });

    result = result.slice(0, 5);
    console.log("RESULT: ", result);
    return res.json([...result])
}
