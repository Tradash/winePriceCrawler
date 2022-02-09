import threads from 'worker_threads';
import path from "path";
const workerFile = path.join(__dirname, "./crawler.js")

export interface IWorkerData {
    shopUrl:string, categoriesUrl:string, descUrl:string
}

export const startWorker = (wData:IWorkerData) => {
    const thr=new threads.Worker(workerFile, {workerData:wData})
    thr.on("error", err=>{
        console.error("Ошибка в воркере", wData,err)
    })
    thr.on("exit", code=>console.log("Воркер завершил работу с кодом", code))
}
