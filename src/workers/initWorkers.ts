import threads from 'worker_threads';
import path from 'path';
let workerFile = path.join(__dirname, './crawler.js');

export interface IWorkerData {
  shopUrl: string;
  categoriesUrl: string;
  descUrl: string;
}

export const startWorker = (wData: IWorkerData | null) => {
  if (!wData) workerFile = path.join(__dirname, './getDetailInfo.js');
  const thr = new threads.Worker(workerFile, { workerData: wData });
  thr.on('error', (err) => {
    console.error('Ошибка в воркере', wData, err);
  });
  thr.on('exit', (code) => console.log('Воркер завершил работу с кодом', code));
};
