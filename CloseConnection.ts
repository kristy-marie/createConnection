import { NextApiResponse, NextApiRequest } from 'next';
import {ConnectionModel, ConnectionStatus, getConnectionById, updateConnection} from 'datalayer';


export default async function handler (req: NextApiRequest, res: NextApiResponse<any>){
    switch(req.method){
        case 'PUT':
            await closeConnection(req,res);
            break;
        default:
            res.status(405).json({ message: 'Endpoint only supports PUT'});
    }
}

async function closeConnection(req:NextApiRequest, res:NextApiResponse<any>){

    
    try{
        const userId = req.headers['x-user-id'] as string;
        const { connectionId } = req.query;
        console.log('connectionId:', connectionId);


        if(!connectionId){
            return res.status(400).json({ message: 'No connectionID provided' });
        }
        const connection = await getConnectionById(connectionId as string);
        const connectionData = connection.data() as ConnectionModel;

        if(!connectionData){
            return res.status(400).json({ message: `connectionId: ${connectionId} has no associated connection`})
        }
        if(connectionData.menteeUserId !== userId && connectionData.mentorUserId !== userId){
            return res.status(400).json({message: `userId: ${userId} is not authorized to modify connectionId: ${connectionId}`});
        }
        if(connectionData.status !== ConnectionStatus.Active){
            return res.status(400).json({ message: `connectionId: ${connectionId} can only be closed if it is active`});
        }
        // create new connection object
        const newConnection: ConnectionModel = {
            mentorUserId: connectionData.mentorUserId,
            menteeUserId: connectionData.menteeUserId,
            status:connectionData.status as ConnectionStatus,
            updatedAt: Date.now(),
         
           
        };
        //update connection data in db
        const updatedConnectionData = {
            ...connectionData,
            status: ConnectionStatus.Closed,
            updatedAt: Date.now(),
        };
       
          
     

        await updateConnection(connection.ref, updatedConnectionData)
        return res.status(200).json({ success: true});
    } catch(err: any){
        console.error("Error in /api/connections/[connectionId]/close", err);
        res.status(500).json({ message: 'unexpected error'});
    }
}
