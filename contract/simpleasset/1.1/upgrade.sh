#1/bin/bash
set -xsu
docker-compose -f /home/bstudent/fabric-samples/basic-network/docker-compose.yml up -d cli
sleep 3
docker ps -a

docker exec cli peer chaincode install -n simpleasset -v 1.1 -p github.com/simpleasset/1.1
docker exec cli peer chaincode list --installed

docker exec cli peer chaincode instantiate -n simpleasset -v 1.1 -c mychannel -c '{"Args":[]}' -P 'OR ("Org1MSP.member", "Org2MSP.member")'
docker exec cli peer chaincode list --instantiated -C mychannel
sleep 3

docker exec cli peer chaincode list --instantiated -C mychannel
docker exec cli peer chaincode query -n simpleasset -C mychannel -c '{"Args":["get","a"]}'
docker exec cli peer chaincode invoke -n simpleasset -C mychannel -c '{"Args":["set","b","200"]}'
sleep 3
docker exec cli peer chaincode query -n simpleasset -C mychannel -c '{"Args":["get","b"]}'