#!/usr/bin/env node
import process from "node:process";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

const RAG_API_BASE = process.env.RAG_API_BASE || "http://127.0.0.1:4000";

/** NEVER write to stdout except framed JSON-RPC. Use stderr for logs. */
function log(...a){ process.stderr.write(a.join(" ") + "\n"); }

function send(obj){
  const s = JSON.stringify(obj);
  const h = `Content-Length: ${Buffer.byteLength(s,"utf8")}\r\n\r\n`;
  process.stdout.write(h + s);
}

function fetchJson(urlStr){
  return new Promise((resolve,reject)=>{
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.get(u,(res)=>{
      let data=""; res.setEncoding("utf8");
      res.on("data", c => data+=c);
      res.on("end", ()=>{
        try { resolve(JSON.parse(data||"{}")); }
        catch(e){ reject(new Error(`Bad JSON from ${urlStr}: ${e.message}`)); }
      });
    });
    req.on("error", reject); req.end();
  });
}

function formatAsk(j){
  const cites=(j.citations||[]).map((c,i)=>{
    const doc=c.doc_id||c.docId||"(doc)";
    const head=c.heading?` — ${c.heading}`:"";
    const sc = c.score ?? c.sem_score ?? c.lex_score ?? "";
    return `#${i+1} score=${sc}  ${doc}${head}`;
  }).join("\n");
  const conf = j.confidence ? `\nConfidence: ${j.confidence.level} (${j.confidence.score ?? ""})` : "";
  return `=== ANSWER ===
${j.answer || "(no answer)"}${conf}

=== CITATIONS (${(j.citations||[]).length}) ===
${cites || "(none)"}\n`;
}
function formatSearch(j){
  const hits=(j.hits||[]).map((h,i)=>{
    const doc=h.doc_id||h.docId||"(doc)";
    const head=h.heading?` — ${h.heading}`:"";
    const sc = h.score ?? h.sem_score ?? h.lex_score ?? "";
    return `#${i+1} score=${sc}  ${doc}${head}`;
  }).join("\n");
  return `=== HITS (${(j.hits||[]).length}) ===
${hits || "(none)"}\n`;
}

let buf="";
process.stdin.setEncoding("utf8");
process.stdin.on("data", chunk=>{
  buf+=chunk;
  for(;;){
    const p=buf.indexOf("\r\n\r\n");
    if(p===-1) break;
    const m=buf.slice(0,p).match(/Content-Length:\s*(\d+)/i);
    const len=m?parseInt(m[1],10):0;
    const start=p+4;
    if(buf.length<start+len) break;
    const body=buf.slice(start,start+len);
    buf=buf.slice(start+len);
    try{ onMessage(JSON.parse(body)); }
    catch(e){ log("[server] bad JSON from client:", e.message); }
  }
});

async function onMessage(msg){
  if(msg.method==="initialize"){
    return send({
      jsonrpc:"2.0", id:msg.id,
      result:{
        protocolVersion:"2024-11-05",
        capabilities:{},
        serverInfo:{ name:"docs-rag-bridge", version:"2.0.0" }
      }
    });
  }
  if(msg.method==="tools/list"){
    return send({
      jsonrpc:"2.0", id:msg.id,
      result:{ tools:[
        {
          name:"search_docs",
          description:"Hybrid search with scores.",
          inputSchema:{
            type:"object",
            properties:{
              query:{type:"string"},
              k:{type:"number",default:10},
              method:{type:"string",enum:["lin","rrf","mix"],default:"lin"},
              alpha:{type:"number",default:0.7},
              rrfK:{type:"number",default:60},
              ef:{type:"number",default:100},
              path:{type:"string"}
            },
            required:["query"]
          }
        },
        {
          name:"ask_docs",
          description:"Grounded answer with citations.",
          inputSchema:{
            type:"object",
            properties:{
              question:{type:"string"},
              k:{type:"number",default:12},
              method:{type:"string",enum:["lin","rrf","mix"],default:"mix"},
              alpha:{type:"number",default:0.7},
              rrfK:{type:"number",default:60},
              ef:{type:"number",default:100},
              path:{type:"string"}
            },
            required:["question"]
          }
        }
      ]}
    });
  }
  if(msg.method==="tools/call"){
    try{
      const {name, arguments:args={}} = msg.params || {};
      if(name==="search_docs"){
        const u=new URL("/api/search2", RAG_API_BASE);
        Object.entries(args).forEach(([k,v])=>{ if(v!=null && v!=="") u.searchParams.set(k,String(v)); });
        const j=await fetchJson(u.toString());
        return send({ jsonrpc:"2.0", id:msg.id, result:{ content:[{type:"text", text:formatSearch(j)}] } });
      }
      if(name==="ask_docs"){
        const u=new URL("/api/ask2", RAG_API_BASE);
        Object.entries(args).forEach(([k,v])=>{ if(v!=null && v!=="") u.searchParams.set(k,String(v)); });
        const j=await fetchJson(u.toString());
        return send({ jsonrpc:"2.0", id:msg.id, result:{ content:[{type:"text", text:formatAsk(j)}] } });
      }
      return send({ jsonrpc:"2.0", id:msg.id, error:{ code:-32601, message:`Unknown tool ${name}` }});
    }catch(e){
      return send({ jsonrpc:"2.0", id:msg.id, error:{ code:-32000, message:e?.message || String(e) }});
    }
  }
}


