const vm=require('vm'),fs=require('fs');
const html=fs.readFileSync(require('path').join(__dirname,'..','apps','storefront','public','homepage.html'),'utf8');const code=html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/)[1].replace(/\.catch\(\(\)=>\{\}\)/g,'.catch(e=>console.log("SWALLOWED:",e.message))');
const calls=[];
const U=(name='x')=>new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:k===Symbol.iterator?function*(){}:k===Symbol.toPrimitive?()=>0:k==='length'?0:U(name+'.'+String(k)),apply:(t,th,a)=>{calls.push(name);return U(name+'()')},construct:()=>U('new '+name),set:()=>true,has:()=>true});
const products=[{slug:'a',name:{en:'Alpha',fr:'Alpha',ar:''},volumeMl:500},{slug:'b',name:{en:'Beta',fr:'Bêta',ar:'بيتا'},volumeMl:1000}];
const home={sections:[{kind:'hero',content:{heading:{en:'Hello',fr:'Salut',ar:''},body:{en:'Body',fr:'',ar:''},buttonLabel:{en:'Shop',fr:'',ar:''},buttonLink:'/products'}}]};
const els={};const dom=new Proxy({},{get:()=>1});
const ctx={THREE:U('THREE'),gsap:U('gsap'),document:{getElementById:id=>els[id]||(els[id=id]=U('el#'+id)),querySelector:s=>els[s]||(els[s]=U('q'+s)),querySelectorAll:()=>[U('qa')],addEventListener(){},documentElement:U('html'),body:U('body'),cookie:'lang=fr',createElement:()=>U('ce')},
 matchMedia:()=>({matches:false}),innerWidth:1200,innerHeight:800,devicePixelRatio:1,addEventListener(){},requestAnimationFrame(){},setTimeout,
 fetch:u=>Promise.resolve({ok:true,json:async()=>u.includes('pages')?home:products}),console,top:{location:{}}};
ctx.window=ctx;let err=null;
try{vm.runInNewContext(code,ctx)}catch(e){err=e}
setTimeout(()=>{console.log(err?('ERROR: '+err.stack.split('\n').slice(0,3).join(' | ')):'initial run OK (stubbed DOM/THREE)');
 console.log('cta set:',String(els['cta']&&1), '| gsap calls recorded:',calls.filter(c=>c.startsWith('gsap')).length)},50);
process.on('unhandledRejection',e=>console.log('REJECTION',e.message))
