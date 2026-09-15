
let sims=[], orders=JSON.parse(localStorage.hg_orders||"[]"), cart=JSON.parse(localStorage.hg_cart||"[]"), category="";
const $=id=>document.getElementById(id), money=n=>Number(n).toLocaleString("vi-VN")+" đ";
async function init(){
  const local=JSON.parse(localStorage.hg_inventory||"null");
  sims=local || await fetch("data/sims.json").then(r=>r.json());
  render(); updateCart(); loadContact();
}
function save(){localStorage.hg_inventory=JSON.stringify(sims);localStorage.hg_orders=JSON.stringify(orders);localStorage.hg_cart=JSON.stringify(cart)}
function available(){return sims.filter(s=>s.status==="available")}
function render(){
  const q=($("searchInput").value||"").toLowerCase().replaceAll(".","").trim();
  const net=$("networkFilter").value, max=+$("priceFilter").value||Infinity, sort=$("sortFilter").value;
  let a=available().filter(s=>(!q||s.number.replaceAll(".","").includes(q)||s.type.toLowerCase().includes(q)||s.category.includes(q))&&(!net||s.network===net)&&s.price<=max&&(!category||s.category===category));
  if(sort==="low")a.sort((x,y)=>x.price-y.price); else if(sort==="high")a.sort((x,y)=>y.price-x.price); else a.sort((x,y)=>Number(y.featured)-Number(x.featured));
  $("resultInfo").textContent=`Có ${a.length} SIM phù hợp`;
  $("simGrid").innerHTML=a.map(s=>`<article class="simCard"><div class="simTop"><span class="tag">${s.type}</span><span class="network">${s.network}</span></div><div class="simNumber">${s.number}</div><small>✓ Đang còn hàng</small><div class="simPrice">${money(s.price)}</div><div class="simActions"><button class="goldBtn" onclick="openOrder('${s.id}')">Mua / Tư vấn</button><button class="outlineBtn" onclick="addCart('${s.id}')">+ Chọn</button></div></article>`).join("")||"<p>Không tìm thấy SIM phù hợp.</p>";
}
function setCategory(c){category=c;render();$("kho").scrollIntoView({behavior:"smooth"})}
function addCart(id){if(!cart.includes(id))cart.push(id);save();updateCart();toast("Đã thêm SIM vào giỏ")}
function updateCart(){$("cartCount").textContent=cart.length}
function openOrder(id){const s=sims.find(x=>x.id===id);openModal(`<h2>Đăng ký mua / tư vấn</h2><div class="notice"><b>${s.number}</b> • ${s.network} • ${money(s.price)}</div><div class="form"><input id="custName" placeholder="Họ và tên *"><input id="custPhone" placeholder="Số điện thoại *"><textarea id="custNote" placeholder="Ghi chú thêm"></textarea><button class="goldBtn" onclick="submitOrder('${s.id}')">Gửi yêu cầu</button></div>`)}
function submitOrder(id){const name=$("custName").value.trim(),phone=$("custPhone").value.trim(),note=$("custNote").value.trim();if(!name||!phone)return toast("Vui lòng nhập họ tên và số điện thoại");const s=sims.find(x=>x.id===id);orders.unshift({id:Date.now(),time:new Date().toLocaleString("vi-VN"),simId:id,number:s.number,name,phone,note,status:"Mới"});save();closeModal();toast("Đã nhận yêu cầu. Shop sẽ liên hệ.");}
function showCart(){const a=cart.map(id=>sims.find(s=>s.id===id)).filter(Boolean);openModal(`<h2>🛒 SIM đã chọn</h2>${a.length?a.map(s=>`<div class="notice"><b>${s.number}</b> — ${money(s.price)}<br><button class="goldBtn" onclick="openOrder('${s.id}')">Tư vấn số này</button></div>`).join(""):"<p>Chưa có SIM nào.</p>"}`)}
function sendAI(text){if(!text)return;addBubble(text,"user");const t=text.toLowerCase();let net=["viettel","vinaphone","mobifone","vietnamobile"].find(n=>t.includes(n));let max=Infinity;for(const v of (t.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|k|nghìn|ngàn)?/g)||[])){const x=parseFloat(v.replace(",",".")),u=v.includes("triệu")||v.includes("tr")?1e6:v.includes("k")||v.includes("nghìn")||v.includes("ngàn")?1e3:1;if(u>1)max=Math.min(max,x*u)}let cat=t.includes("ngũ quý")?"ngu-quy":t.includes("tứ quý")?"tu-quy":t.includes("tam hoa")?"tam-hoa":t.includes("tiến")?"so-tien":t.includes("năm sinh")?"nam-sinh":t.includes("dễ nhớ")?"de-nho":"";let a=available().filter(s=>(!net||s.network.toLowerCase()===net)&&s.price<=max&&(!cat||s.category===cat)).slice(0,5);setTimeout(()=>addBubble(a.length?`Tôi tìm được <b>${a.length} số</b> phù hợp:<br><br>`+a.map(s=>`<div class="notice"><b>${s.number}</b> — ${s.network} — ${money(s.price)}<br><button class="goldBtn" onclick="openOrder('${s.id}')">Tư vấn số này</button></div>`).join(""):"Kho hiện chưa có số đúng tiêu chí. Anh/chị thử tăng ngân sách hoặc bỏ bớt điều kiện nhé.","bot"),220)}
function addBubble(html,cls){const d=document.createElement("div");d.className="bubble "+cls;d.innerHTML=html;$("chat").appendChild(d);$("chat").scrollTop=99999}
function openModal(html){$("modalBody").innerHTML=html;$("modal").classList.add("show")}
function closeModal(){$("modal").classList.remove("show")}
function toast(x){$("toast").textContent=x;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",2200)}
function loadContact(){if(localStorage.hg_phone)$("footerPhone").textContent=localStorage.hg_phone;if(localStorage.hg_zalo)$("footerZalo").textContent=localStorage.hg_zalo}
document.addEventListener("click",e=>{const c=e.target.closest("[data-category]");if(c)setCategory(c.dataset.category);const p=e.target.closest("[data-prompt]");if(p){$("aiInput").value=p.dataset.prompt;sendAI(p.dataset.prompt)}})
$("searchBtn").onclick=render;$("sortFilter").onchange=render;$("clearFilter").onclick=()=>{category="";$("searchInput").value="";$("networkFilter").value="";$("priceFilter").value="";render()};$("aiSend").onclick=()=>{const x=$("aiInput").value.trim();$("aiInput").value="";sendAI(x)};$("aiInput").addEventListener("keydown",e=>{if(e.key==="Enter")$("aiSend").click()});$("cartBtn").onclick=showCart;$("modalClose").onclick=closeModal;$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};init();
