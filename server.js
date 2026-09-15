const express=require("express");
const path=require("path");
const {Pool}=require("pg");
const app=express();
app.use(express.json({limit:"2mb"}));
app.use(express.static(path.join(__dirname,"public")));

const PORT=process.env.PORT||10000;
const pool=process.env.DATABASE_URL?new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}):null;
const auth=(req,res,next)=>{
  const h=req.headers.authorization||"";
  if(!h.startsWith("Basic ")) return res.status(401).set("WWW-Authenticate",'Basic realm="Shop Sim Admin"').json({error:"Unauthorized"});
  const [u,p]=Buffer.from(h.slice(6),"base64").toString().split(":");
  if(u===process.env.ADMIN_USER&&p===process.env.ADMIN_PASSWORD)return next();
  res.status(401).set("WWW-Authenticate",'Basic realm="Shop Sim Admin"').json({error:"Sai tài khoản hoặc mật khẩu"});
};
async function init(){
 if(!pool) return;
 await pool.query(require("fs").readFileSync(path.join(__dirname,"scripts/schema.sql"),"utf8"));
 const c=await pool.query("SELECT COUNT(*)::int n FROM sims");
 if(c.rows[0].n===0){
  const seed=require("./data/seed.json");
  for(const s of seed) await pool.query("INSERT INTO sims(number,network,type,category,price,status,featured) VALUES($1,$2,$3,$4,$5,$6,$7)",s);
 }
}
app.get("/api/health",(req,res)=>res.json({ok:true,database:!!pool}));
app.get("/api/sims",async(req,res)=>{
 try{
  if(!pool)return res.status(503).json({error:"Chưa cấu hình DATABASE_URL"});
  const {q="",network="",category="",max="",sort="featured"}=req.query;
  const vals=[];let where=["status='available'"];
  if(q){vals.push("%"+q.replace(/\./g,"")+"%");where.push("REPLACE(number,'.','') ILIKE $"+vals.length);}
  if(network){vals.push(network);where.push("network=$"+vals.length);}
  if(category){vals.push(category);where.push("category=$"+vals.length);}
  if(max){vals.push(Number(max));where.push("price <= $"+vals.length);}
  let order=sort==="low"?"price ASC":sort==="high"?"price DESC":"featured DESC, created_at DESC";
  const r=await pool.query(`SELECT * FROM sims WHERE ${where.join(" AND ")} ORDER BY ${order}`,vals);
  res.json(r.rows);
 }catch(e){res.status(500).json({error:e.message})}
});
app.get("/api/sims/:id",async(req,res)=>{
 try{const r=await pool.query("SELECT * FROM sims WHERE id=$1",[req.params.id]);if(!r.rowCount)return res.status(404).json({error:"Không tìm thấy SIM"});res.json(r.rows[0])}catch(e){res.status(500).json({error:e.message})}
});
app.post("/api/orders",async(req,res)=>{
 try{
  const {simId,name,phone,note=""}=req.body;
  if(!simId||!name||!phone)return res.status(400).json({error:"Thiếu thông tin"});
  const c=await pool.connect();
  try{
   await c.query("BEGIN");
   const s=await c.query("SELECT * FROM sims WHERE id=$1 FOR UPDATE",[simId]);
   if(!s.rowCount||s.rows[0].status!=="available"){await c.query("ROLLBACK");return res.status(409).json({error:"SIM này vừa hết hàng"});}
   const x=s.rows[0];
   const o=await c.query("INSERT INTO orders(sim_id,number,customer_name,phone,note) VALUES($1,$2,$3,$4,$5) RETURNING *",[x.id,x.number,name,phone,note]);
   await c.query("UPDATE sims SET status='reserved',updated_at=NOW() WHERE id=$1",[x.id]);
   await c.query("COMMIT");res.status(201).json({ok:true,order:o.rows[0]});
  }catch(e){await c.query("ROLLBACK");throw e}finally{c.release()}
 }catch(e){res.status(500).json({error:e.message})}
});
app.get("/api/admin/sims",auth,async(req,res)=>{try{res.json((await pool.query("SELECT * FROM sims ORDER BY created_at DESC")).rows)}catch(e){res.status(500).json({error:e.message})}});
app.post("/api/admin/sims",auth,async(req,res)=>{
 try{const {number,network,type="SIM số đẹp",category="de-nho",price=0,featured=false}=req.body;
  const r=await pool.query("INSERT INTO sims(number,network,type,category,price,featured) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",[number,network,type,category,price,featured]);res.status(201).json(r.rows[0])
 }catch(e){res.status(400).json({error:e.code==="23505"?"Số SIM đã tồn tại":e.message})}
});
app.put("/api/admin/sims/:id",auth,async(req,res)=>{
 try{const {number,network,type,category,price,featured,status}=req.body;
 const r=await pool.query("UPDATE sims SET number=$1,network=$2,type=$3,category=$4,price=$5,featured=$6,status=$7,updated_at=NOW() WHERE id=$8 RETURNING *",[number,network,type,category,price,!!featured,status,req.params.id]);
 res.json(r.rows[0])}catch(e){res.status(400).json({error:e.message})}
});
app.get("/api/admin/orders",auth,async(req,res)=>{try{res.json((await pool.query("SELECT * FROM orders ORDER BY created_at DESC")).rows)}catch(e){res.status(500).json({error:e.message})}});
app.put("/api/admin/orders/:id",auth,async(req,res)=>{
 try{const r=await pool.query("UPDATE orders SET status=$1 WHERE id=$2 RETURNING *",[req.body.status,req.params.id]);res.json(r.rows[0])}catch(e){res.status(400).json({error:e.message})}
});
app.get("/api/admin/stats",auth,async(req,res)=>{
 try{const r=await pool.query("SELECT COUNT(*) FILTER(WHERE status='available') available,COUNT(*) FILTER(WHERE status='sold') sold,COUNT(*) FILTER(WHERE status='reserved') reserved,COALESCE(SUM(price) FILTER(WHERE status IN('available','reserved')),0) value FROM sims");const o=await pool.query("SELECT COUNT(*) FILTER(WHERE status='Mới') new_orders,COUNT(*) total FROM orders");res.json({...r.rows[0],...o.rows[0]})}catch(e){res.status(500).json({error:e.message})}
});
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
init().then(()=>app.listen(PORT,()=>console.log("Shop Sim Hoàng Gia running on "+PORT))).catch(e=>{console.error(e);process.exit(1)});
