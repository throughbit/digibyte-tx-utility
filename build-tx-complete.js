/*
Developed at ThroughBit Technologies Pvt.Ltd
HYFERx Project
Digibyte Transaction Builder
Builds a raw transaction and signs offline.
Broadcasts to a remote node - preferably over a local network to isolate keys from the internet
*/
//-o_O===init===================================================~|
'use strict';
//-o_o===modules=================================================|
const digibyte = require('digibyte');
const utxo = require('./build-tx-inputs');
const txS = require('./build-tx-outputs');
const broadcaster = require('./Broadcaster');
const errorSet = require('./errors');
const holdup = require('./wait');
//-o_o===/modules================================================|
//Obfuscate your pk even further than an env variable.
//However, since this module will be isolated form the internet, env should suffice
const WIF = process.env.WIF;
const imported = digibyte.PrivateKey.fromWIF(WIF).toString();
console.log(imported);
const changeAddress='DBDAhnDHhs1qRdW2tURnc95JrAy5eK5WbW';
const fee=2000;
//-o_o===SignTx==================================================|
function sign_tx (inputs,outputs,fee,change,pk){
 return new Promise((resolve,reject)=>{
  try{
   console.log(inputs,outputs,fee,change,pk);
   var transaction = new digibyte.Transaction();
   transaction.from(inputs);
   let tx_to = function(i){
    if(i < outputs.length){
     transaction.to(outputs[i].address,outputs[i].amount);
     console.log("WETRYING:" , i);
     //holdup.wait(outputs.length * 100);
     tx_to(i+1);
    }
    else if (i >= outputs.length) {
     transaction.fee(fee)
     .change(change)
     .sign(pk);
     resolve(transaction);
    }
   }
   tx_to(0);
  }
  catch(e){
  //console.log({fail_response,e});
   reject (e);
  }
 });
}
//-o_o===BroadcastTx=============================================|
function broadcast_tx(outputs){
 return new Promise((resolve,reject)=>{
  try{
   const addresses=["DBDAhnDHhs1qRdW2tURnc95JrAy5eK5WbW"];
   //read addresses from a file
   console.log("OUTPUTS",outputs);
   utxo.build_TxInputs(addresses)
    .then(inputs=>sign_tx(inputs,outputs,fee,changeAddress,imported)
     .then((hex)=>{
      console.log(hex)
     //colliding function names. the broadcast_tx below is being exported from broadcast ;)
      broadcaster.broadcast_to_node(hex.toString())
      .then((response)=>{
       console.log("MORE RES:",response);
       resolve(response);
      })
     })
    )//closes first utxo.build_TxInputs(addresses).then(...
    .catch((e)=>{
     console.log(e);
     reject(e);
    })
   }
   catch(e){
    reject (e);
   }
 });
}
//-o_o===exports==========================================------||
module.exports={broadcast_tx}
//-o_o===fin==============================================------||
