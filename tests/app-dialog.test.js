const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');

const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const start=app.indexOf('let appConfirmationResolver=null;');
const end=app.indexOf('\nfunction showNotice(',start);
assert.ok(start>=0&&end>start,'dialog functions must be available');

function element(){return {textContent:'',value:'',hidden:false,dataset:{},classList:{active:false,add(){this.active=true;},remove(){this.active=false;}},focus(){this.focused=true;}};}
const elements={appConfirmModal:element(),appConfirmTitle:element(),appConfirmMessage:element(),appConfirmDetail:element(),appConfirmInputWrap:element(),appConfirmInputLabel:element(),appConfirmInput:element(),appConfirmAccept:element(),appConfirmCancel:element()};
elements.appConfirmModal.querySelector=selector=>selector==='.appConfirmCard'?elements.card:selector==='.appConfirmEyebrow'?elements.eyebrow:null;
elements.card=element();elements.eyebrow=element();
const context=vm.createContext({Promise,Boolean,String,setTimeout:fn=>fn(),document:{activeElement:null,getElementById:id=>elements[id]||null}});
vm.runInContext(app.slice(start,end),context);

(async()=>{
  let pending=vm.runInContext('showAppConfirmation({title:"Delete project?",confirmLabel:"Delete"})',context);vm.runInContext('closeAppConfirmation(true)',context);assert.equal(await pending,true,'confirmation must resolve true');
  pending=vm.runInContext('showAppConfirmation({title:"Keep project?"})',context);vm.runInContext('closeAppConfirmation(false)',context);assert.equal(await pending,false,'confirmation must resolve false');
  pending=vm.runInContext('showAppPrompt({title:"Project name",defaultValue:"Smith"})',context);elements.appConfirmInput.value='Smith Copy';vm.runInContext('closeAppConfirmation(true)',context);assert.equal(await pending,'Smith Copy','prompt must return entered text');
  pending=vm.runInContext('showAppPrompt({title:"Project name"})',context);vm.runInContext('closeAppConfirmation(false)',context);assert.equal(await pending,null,'canceled prompt must return null');
  pending=vm.runInContext('showAppAlert({title:"Saved"})',context);assert.equal(elements.appConfirmCancel.hidden,true,'alert mode must hide cancel');vm.runInContext('closeAppConfirmation(true)',context);assert.equal(await pending,true,'alert must resolve when acknowledged');
  assert.equal(elements.appConfirmModal.classList.active,false,'dialog must close after a choice');
  console.log('app dialog tests passed');
})().catch(error=>{console.error(error);process.exitCode=1;});
