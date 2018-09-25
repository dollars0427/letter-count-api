const Koa = require('koa');
const koaBody = require('koa-body');
const cors = require('@koa/cors');
const textract = require('textract');
const fs = require('fs');
const lc = require('letter-count');
const log4js = require('koa-log4')

const infoLogger = log4js.getLogger('info');
infoLogger.level = 'info';

const errorLogger = log4js.getLogger('error');
errorLogger.level = 'error';

const app = new Koa();
app.use(koaBody({ multipart: true }));
app.use(cors());

app.use(async ctx => {
  const files = ctx.request.files;
  const option = ctx.request.body.option;

  if(!files){
    ctx.body = JSON.stringify({'message' :'Please provide word file to here.'});
    return;
  }
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  const filesKeys = Object.keys(files);
  let totalCount = 0;
  const fileList = [];
  const funList = [];
  for(let i = 0; i < filesKeys.length; i++){
    const fileKey = filesKeys[i];
    const fileName = files[fileKey].name;
    const filePath = files[fileKey].path;
    const fileType = files[fileKey].type;
    const file = fs.readFileSync(filePath);
    const count = await countText(file, fileType, option);

    totalCount+= count;
    fileList.push(fileName);
  }
  ctx.body = JSON.stringify(
    { files: fileList,
      totalCount,
    }
  );
});

function countText(file, fileType, option){
  return new Promise((resolve, reject) => {
    textract.fromBufferWithMime(fileType, file, function(error, text) {
      if(error){
        errorLogger.error(error);
      };
      switch(option){
        case 'words':
        let wordsCount = 0;
        const words = (lc.count(text.trim(), '-w')).words;
        wordsCount += words;
        resolve(wordsCount);
        break;

        default:
        let charsCount = 0;
        const chars = (lc.count(text.trim(), '-c')).chars;
        charsCount += chars;
        resolve(charsCount);
        break;
      }
    });
  });
};

app.listen(8000, () => {
  infoLogger.info('Word Count API is now running on port 8000 ∠( ᐛ 」∠)＿');
});
