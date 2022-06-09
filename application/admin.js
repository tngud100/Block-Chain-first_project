'use strict';
// 1. 모듈포함

const FabricCAServices = require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const fs =require('fs');
const path = require('path');

// 2. ccp 객체화
const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);


async function main(){
    try{
        // 3. ca 접속
        const caURL = ccp.certificateAuthorities['ca.example.com'].url;
        const ca = new FabricCAServices(caURL);
        // 4. wallet에서 기존 admin 확인
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log('Wallet path: ${walletPath}');

        const adminExists = await wallet.exists('admin');
        if(adminExists){
            console.log('An identity for the admin user "admin" already exists in the wallet');
            return;
        }
        // 5. admin 등록
        const enrollment = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'adminpw'});
        // console.log(enrollment);
        const identity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import('admin', identity);
        console.log('Successfully enrolled amin user "admin" and imported it into the wallet');
        // 6. 인증서 발급

    }catch (error){
        console.error(`Failed to enroll admin user "admin": ${error}`);
        process.exit(1);
    }
}

main();