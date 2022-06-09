'use strict';

// 1. 모듈포함 (fabric-network) -> FileSystemWallet, GateWay, X509WalletMixin
const { FileSystemWallet, Gateway, X509WalletMixin} = require('fabric-network');
const fs = require('fs');
const path = require('path');

// 2. ccp 객체화
const ccpPath = path.resolve(__dirname, 'connection.json');
const ccpJSON = fs.readFileSync(ccpPath,'utf-8');
const ccp = JSON.parse(ccpJSON);

async function main(){
    try{
        var userid = 'user1';
        var role = 'client';

        // 3. wallet 에서 user1, admin 검사
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        const userExists = await wallet.exists(userid);
        
        if(userExists) {
            console.log('An identity for the user already exits in the wallet');
            return;
        }
        const adminExists = await wallet.exists('admin');
        if(!adminExists){
            console.log('An identity for the admin user does not exist in the wallet');
            return;
        }
        // 4. 게이트웨이 연결 -> admin identity 가져오기
        const gateway = new Gateway();
        await gateway.connect(ccp, {wallet, identity: 'admin', discovery: {enabled:false}});
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // 5. register -> enroll -> import(저장)
        const secret = await ca.register({affiliation: 'org1.department1', enrollmentID: userid, role: role},
        adminIdentity);
        const enrollment = await ca.enroll({enrollmentID: userid, enrollmentSecret: secret});
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import(userid, userIdentity);
        console.log('Successfully registered and enrolled admin user and import it into the wallet');

    }catch(error){
        console.error(`Failed to enroll user : ${error}`);
        process.exit(1);
    }
}

main()