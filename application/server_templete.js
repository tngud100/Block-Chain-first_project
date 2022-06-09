// 1. 모듈포함
// 1.1 객체 생성 
const express = require('express');
const app = express();
var bodyParser = require('body-parser');

const { FileSystemWallet, Gateway } = require('fabric-network');

const fs = require('fs');
const path = require('path');

// 2. 서버설정
// 2.1 패브릭 연결설정
const ccpPath = path.resolve(__dirname, 'connection.json'); // /home/bstudent/dev/first-project/application/connection.json
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON); // unmarshal? []byte -> 구조체 객체화~

// 2.2 서버 속성 설정
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// 3. HTML 라우팅
// 3.1 index.html
app.get('/', (request, response)=>{  // callback 함수 
    response.sendFile(__dirname + '/index.html');
})
// 3.2 create.html
app.get('/create', (request, response)=>{  // callback 함수 
    response.sendFile(__dirname + '/views/create.html');
})
// 3.3 query.html
app.get('/query', (request, response)=>{  // callback 함수 
    response.sendFile(__dirname + '/views/query.html');
})

app.get('/transfer', (request, response)=>{  // callback 함수 
    response.sendFile(__dirname + '/views/transfer.html');
})

// 4. REST api 라우팅

app.post('/user', async(request, response)=>{
    
})

// 4.1 /asset POST
app.post('/asset', async(request, response)=>{
    // 어플리케이션 요청문서에서 파라미터 꺼내기 ( POST method에서는 body에서 꺼냄 )
    const id    = request.body.id;
    const key   = request.body.key;
    const value = request.body.value;
    console.log('/asset-post-'+key+'-'+value);
    // 인증서작업 -> user1
    const walletPath = path.join(process.cwd(), 'wallet') // ~/dev/first-project/application/wallet
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists(id);
    if(!userExists) {
        console.log(`An identity for the user ${id} does nto exist in the wallet`);
        console.log('Run the registerUser.js application before retrying');
        // 클라이언트에서 인증서에 관한 안내 HTML을 보내줘야 함
        response.status(401).sendFile(__dirname + '/unauth.html');
        return;
    }
    // 게이트웨이연결
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: id , discovery: { enabled: false } });
    // 채널 연결
    const network = await gateway.getNetwork('mychannel');
    // 체인코드 연결
    const contract = network.getContract('simpleasset');
    // 트랜젝션처리
    await contract.submitTransaction('set', key, value);
    console.log('Transaction has been submitted');
    // 게이트웨이연결 해제
    await gateway.disconnect();
    // 결과 클라이언트에 전송
    // result.html수정 
    const resultPath = path.join(process.cwd(), '/views/result.html')
    var resultHTML = fs.readFileSync(resultPath, 'utf8');
    resultHTML = resultHTML.replace("<div></div>", "<div><p>Transaction has been submitted</p></div>");
    response.status(200).send(resultHTML);
})
// 4.2 /asset GET
app.get('/asset', async(request, response)=>{
    // 어플리케이션 요청문서에서 파라미터 꺼내기 ( POST method에서는 query에서 꺼냄 )
    const key   = request.query.key;
    const id   = request.query.id;

    console.log('/asset-get-'+key);
    // 인증서작업 -> user1
    const walletPath = path.join(process.cwd(), 'wallet') // ~/dev/first-project/application/wallet
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists(id);
    if(!userExists) {
        console.log(`An identity for the user ${id} does not exist in the wallet`);
        console.log('Run the registerUser.js application before retrying');
        // 클라이언트에서 인증서에 관한 안내 HTML을 보내줘야 함
        // response.status(401).sendFile(__dirname + '/unauth.html');
        const obj = JSON.parse(`{"ERR_MSG":"An identity for the user ${id} does not exist in the wallet"}`);
        response.status(400).json(obj);
        return;
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: id, discovery: { enabled: false } });

    const network = await gateway.getNetwork('mychannel');

    const contract = network.getContract('simpleasset');

    const txresult = await contract.evaluateTransaction('get', key);
    console.log('Transaction has been evaluated: '+txresult);

    await gateway.disconnect();
    // 결과 클라이언트에 전송
    // result.html수정 
    // const resultPath = path.join(process.cwd(), '/views/result.html')
    // var resultHTML = fs.readFileSync(resultPath, 'utf8');
    // resultHTML = resultHTML.replace("<div></div>", `<div><p>Transaction has been evaluated: ${txresult}</p></div>`);
    // response.status(200).send(resultHTML);
    const obj = JSON.parse(txresult);
    response.status(200).json(obj);
})

// 4.3 /assets GET
app.get('/assets', async(request, response)=>{
   
})

app.post('/tx', async(request, response)=>{
   
})



// 5. 서버시작
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
