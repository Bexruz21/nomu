import test from 'node:test';
import assert from 'node:assert/strict';
import contact from '../api/contact.js';

function request(overrides = {}) {
  return {method: 'POST', headers: {'content-type': 'application/json', origin: 'https://nomu.uz'}, body: {name: 'Test', email: 'test@example.com', message: '<b>Plain text</b>', service: 'marketing'}, ...overrides};
}
async function run(req) {
  const res = {headers: {}, setHeader(k,v) {this.headers[k]=v;}, status(s) {this.code=s;return this;}, json(body) {this.body=body;return this;}};
  await contact(req,res); return res;
}
test('rejects invalid requests without contacting Telegram', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', () => {throw new Error('Unexpected network call');});
  for (const [req, code] of [
    [request({method:'GET'}),405],
    [request({headers:{'content-type':'text/plain'}}),415],
    [request({headers:{origin:'https://unrelated.example'}}),403],
    [request({body:'{broken'}),400],
    [request({body:{name: {},email:'test@example.com',message:'Hi'}}),400],
    [request({body:{name:'Test',email:'invalid',message:'Hi'}}),400],
    [request({body:{name:'Test',email:'test@example.com',message:'x'.repeat(2501)}}),400]
  ]) assert.equal((await run(req)).code,code);
  assert.equal(fetchMock.mock.callCount(),0);
});
test('sends plain text with server credentials and does not expose upstream errors', async t => {
  const oldToken=process.env.TELEGRAM_BOT_TOKEN, oldChat=process.env.TELEGRAM_CHAT_ID;
  t.after(()=>{for(const [key,value] of [['TELEGRAM_BOT_TOKEN',oldToken],['TELEGRAM_CHAT_ID',oldChat]]) {if(value===undefined) delete process.env[key]; else process.env[key]=value;}});
  process.env.TELEGRAM_BOT_TOKEN='test-token'; process.env.TELEGRAM_CHAT_ID='test-chat';
  const mocked=t.mock.method(globalThis,'fetch',async (url,opts)=>{
    assert.equal(url,'https://api.telegram.org/bottest-token/sendMessage');
    const payload=JSON.parse(opts.body);
    assert.equal(payload.chat_id,'test-chat');
    assert.equal(payload.parse_mode,undefined);
    assert.match(payload.text,/<b>Plain text<\/b>/);
    return {ok:true,json:async()=>({ok:true})};
  });
  assert.deepEqual((await run(request())).body,{ok:true});
  mocked.mock.mockImplementation(async()=>({ok:false,json:async()=>({ok:false,description:'private upstream detail'})}));
  const failed=await run(request()); assert.equal(failed.code,502); assert.deepEqual(failed.body,{ok:false});
  mocked.mock.mockImplementation(async()=>{throw new Error('private upstream detail');});
  assert.equal((await run(request())).code,502);
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await run(request())).code,503);
});
