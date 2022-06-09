// 패키지 정의
package main
// 1. 외부모듈 포함
import (
	"fmt"
	"encoding/json"
	"strconv"
	// "time"
	// "bytes"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	"github.com/hyperledger/fabric/protos/peer"
)
// 2. 체인코드 클래스 정의 - SimpleAsset
type SimpleAsset struct{	
}
type Asset struct{
	key		string	`json:"key"`
	value	string	`json:"value"`
}

// 3. Init 함수
func (t *SimpleAsset) Init(stub shim.ChaincodeStubInterface) peer.Response{
	
	return shim.Success(nil)
}
// 4. Invoke 함수
func (t *SimpleAsset) Invoke(stub shim.ChaincodeStubInterface) peer.Response{
	fn, args := stub.GetFunctionAndParameters()

	if fn == "set"{
		return t.Set(stub, args)
	}else if fn == "del"{
		return t.Del(stub, args)  // args x 1,  amount(key)
	}else if fn == "transfer"{	// args x 3, from, to, amount
		return t.Transfer(stub, args)
	// }else if fn == "history"{	// args x 1,  amount(key)
	// 	return t.History(stub, args)
	}

	return shim.Error("Not supported function name")
}
// 5. Set 함수
func (t *SimpleAsset) Set(stub shim.ChaincodeStubInterface, args [] string) peer.Response{
	if len(args) != 2{
		return shim.Error("Incorrect arguments. Expecting a key and a value")
	}
	asset := Asset{key: args[0], value: args[1]}

	assetAsBytes, err := json.Marshal(asset)
	if err != nil{
		return shim.Error("Failed to marshal arguments: "+ args[0]+"   "+args[1])
	}

	err := stub.PutState(args[0], assetAsBytes)
	if err != nil{
		return shim.Error(fmt.Sprintf("Failed to set asset : %s", args[0]))
	}
	return shim.Success([]byte("asset created: "+ args[0]))
}
// 6. Get 함수
func (t *SimpleAsset) Get(stub shim.ChaincodeStubInterface, args [] string)peer.Response{
	if len(args) != 1{
		return shim.Error("Incorrect argumments. Expecting a key")
	}
	value, err := stub.GetState(args[0])
	if err != nil {
		return shim.Error("Failed to get asset: "+ args[0]+ "with error: "+ err.Error())
	}
	if value == nil{
		return shim.Error("Asset not found: "+args[0])
	}
	return shim.Success([]byte(value))
}
// Del 함수
func (t *SimpleAsset) Del(stub shim.ChaincodeStubInterface, args [] string)peer.Response{
	if len(args) != 1{
		return shim.Error("Incorrect argumments. Expecting a key")
	}
	value, err := stub.GetState(args[0])
	if err != nil {
		return shim.Error("Failed to get asset: "+ args[0]+ "with error: "+ err.Error())
	}
	if value == nil{
		return shim.Error("Asset not found: "+args[0])
	}
	stub.DelState(args[0])

	return shim.Success([]byte("asset delete tx has been submitted: "+args[0]))
}
// Transfer 함수
func (t *SimpleAsset) Transfer(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	if len(args) != 3 {
		return shim.Error("Incorrect arguments. Expecting a from_key, to_key and amount")
	}

	from_asset, err := stub.GetState(args[0])
	if err != nil{
		return shim.Error("Failed to get asset: "+ args[0]+" with error: "+err.Error())
	}
	if from_asset == nil {
		return shim.Error("Asset not found: "+ args[0])
	}
	to_asset, err := stub.GetState(args[1])
	if err != nil{
		return shim.Error("Failed to get asset: "+args[1]+" with error: "+err.Error())
	}
	if to_asset == nil{
		return shim.Error("Asset not found:" +args[1])
	}
	from := Asset{}
	to := Asset{}
	json.Unmarshal(from_asset, &from)
	json.Unmarshal(to_asset, &to)

	from_amount, _  := strconv.Atoi(from.Value)
	to_amount, _:= strconv.Atoi(to.Value)
	amount, _ := strconv.Atoi(args[2])

	if(from_amount - amount) < 0 {
		return shim.Error("Not enough asset value: "+args[0])
	}

	from.Value = strconv.Itoa(from_amount - amount)
	to.Value = strconv.Itoa(to_amount - amount)

	from_asset, _ = json.Marshal(from)
	to_asset, _ = json.Marshal(to)
	
	stub.PutState(args[0], from_asset)
	stub.PutState(args[1], to_asset)

	return shim.Success([]byte("from "+args[0]+" to "+args[1]+": "+ args[2]+" transfer tx is submitted"))
}
// History 함수
// func (t *SimpleAsset) History(stub shim.ChaincodeStubInterface, args []string) peer.Response{
	
// 	if len(args) < 1{
// 		return shim.
// 	}
// }

// 7. main 함수
func main(){
	if err := shim.Start(new(SimpleAsset)); err != nil{
		fmt.Printf("Error starting SimpleAsset chaincode: %s", err)
	}
}