import { DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { s3Client, Bucket } from "../middlewares/storage.middleware.js";

export const deleteFileFromDO = async (key) => {
    try {
        const deleteCommand = new DeleteObjectCommand({
            Bucket: Bucket,
            Key: key
        })

        const response = await s3Client.send(deleteCommand)
        console.log("File deleted Successfully", response)
    }
    catch (error) {
        console.log(error)
    }
}


export const deleteMultipleFilesFromDO = async (keys) => {
    try {
        if (!keys || keys.length === 0) {
            console.log("No keys provided for deletion.");
            return;
        }

        const deleteParams = {
            Bucket: Bucket,
            Delete: {
                Objects: keys.map(key => ({ Key: key })),
                Quiet: false,
            },
        };

        const deleteCommand = new DeleteObjectsCommand(deleteParams);
        const response = await s3Client.send(deleteCommand);

        console.log("Files deleted successfully:", response);
    } catch (error) {
        console.error("Error deleting files:", error);
    }
};
