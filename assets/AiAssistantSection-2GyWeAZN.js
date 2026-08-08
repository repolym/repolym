import{c as F,r as l,N as R,d as W,Q as Te,V as Ae,j as e,W as xe,_ as ue,$ as he,a0 as te,a1 as B,a2 as ze,a3 as Ee,a4 as qe,a5 as Re,u as Le,a6 as Oe,a7 as G,a8 as De,a9 as pe,aa as Je,ab as Ze,ac as Pe,ad as He,ae as We,T as Fe,Z as Ue,af as Ie}from"./index-Dj9OEdS0.js";/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M9 13a4.5 4.5 0 0 0 3-4",key:"10igwf"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M12 13h4",key:"1ku699"}],["path",{d:"M12 18h6a2 2 0 0 1 2 2v1",key:"105ag5"}],["path",{d:"M12 8h8",key:"1lhi5i"}],["path",{d:"M16 8V5a2 2 0 0 1 2-2",key:"u6izg6"}],["circle",{cx:"16",cy:"13",r:".5",key:"ry7gng"}],["circle",{cx:"18",cy:"3",r:".5",key:"1aiba7"}],["circle",{cx:"20",cy:"21",r:".5",key:"yhc1fs"}],["circle",{cx:"20",cy:"8",r:".5",key:"1e43v0"}]],Qe=F("brain-circuit",Ke);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],Be=F("history",Ve);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"m21 3-7 7",key:"1l2asr"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M9 21H3v-6",key:"wtvkvv"}]],Ye=F("maximize-2",Xe);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=[["path",{d:"m14 10 7-7",key:"oa77jy"}],["path",{d:"M20 10h-6V4",key:"mjg0md"}],["path",{d:"m3 21 7-7",key:"tjx5ai"}],["path",{d:"M4 14h6v6",key:"rmj7iw"}]],et=F("minimize-2",Ge);/**
 * @license lucide-react v1.25.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],st=F("sliders-horizontal",tt),rt=s=>{const[r,o]=l.useState([]),[c,i]=l.useState(!1),[v,g]=l.useState(null),S=l.useRef(!0),x=l.useCallback(async(p=!1)=>{if(s&&!(c&&!p)){i(!0),g(null);try{const{data:d,error:m}=await R.from("chat_sessions").select("*").eq("user_id",s).is("deleted_at",null).order("updated_at",{ascending:!1});if(m)throw m;S.current&&o(d||[])}catch(d){const m=W(d);g(m)}finally{S.current&&i(!1)}}},[s]);l.useEffect(()=>(S.current=!0,x(),()=>{S.current=!1}),[x]);const a=l.useCallback(async(p={})=>{if(!s)return null;try{const d={user_id:s,title:p.title||null,messages:p.messages||[]},{data:m,error:y}=await R.from("chat_sessions").insert(d).select().single();if(y)throw y;return await x(!0),m}catch(d){return g(W(d)),null}},[s,x]),N=l.useCallback(async(p,d)=>{if(!s)return null;try{const m={...d,updated_at:new Date().toISOString()},{data:y,error:_}=await R.from("chat_sessions").update(m).eq("id",p).eq("user_id",s).select().single();if(_)throw _;return await x(!0),y}catch(m){return g(W(m)),null}},[s,x]),L=l.useCallback(async p=>{if(!s)return!1;try{const{error:d}=await R.from("chat_sessions").delete().eq("id",p).eq("user_id",s);if(d)throw d;return await x(!0),!0}catch(d){return g(W(d)),!1}},[s,x]),$=l.useCallback(async(p,d)=>{if(!s)return null;try{const{data:m,error:y}=await R.from("chat_sessions").select("messages").eq("id",p).single();if(y)throw y;const J=[...(m==null?void 0:m.messages)||[],...d];return await N(p,{messages:J})}catch(m){return g(W(m)),null}},[s,N]);return{sessions:r,loading:c,error:v,refetch:x,createSession:a,updateSession:N,deleteSession:L,appendMessages:$}},at=["message","summary","content","text","response","answer"],fe=["recommendations","strengths","weaknesses"],nt=s=>{const r=s.trim(),o=/^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i.exec(r);return o?o[1].trim():r},be=s=>{const r=s.trim();return r.startsWith("{")&&r.endsWith("}")||r.startsWith("[")&&r.endsWith("]")},ge=s=>{if(typeof s=="string")return s;if(s==null)return"";if(Array.isArray(s))return s.map(r=>`• ${typeof r=="string"?r:JSON.stringify(r)}`).join(`
`);if(typeof s=="object"){const r=s;for(const o of at){const c=r[o];if(typeof c=="string"&&c.trim()){let i=c.trim();if(be(i))try{return ge(JSON.parse(i))}catch{return i}const v=[];for(const g of fe){const S=r[g];if(Array.isArray(S)&&S.length>0){const x=g==="strengths"?"نقاط قوت":g==="weaknesses"?"نقاط ضعف":"پیشنهادات";v.push(`

**${x}:**
`+S.map(a=>`- ${a}`).join(`
`))}}return i+v.join("")}}for(const o of fe){const c=r[o];if(Array.isArray(c)&&c.length>0)return c.map(i=>`- ${i}`).join(`
`)}return Object.entries(r).filter(([,o])=>o!=null&&o!=="").map(([o,c])=>`**${o}:** ${typeof c=="string"?c:JSON.stringify(c)}`).join(`
`)}return String(s)},ee=s=>{if(!s)return s;let r=s;return r=r.replace(/(?:^|\n)\[\s*\n?([\s\S]*?)\n?\s*\](?=\n|$)/g,(o,c)=>{const i=c.trim();return/\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right|begin|end)/.test(i)||/[=^_{}]/.test(i)?`

$$
${i}
$$

`:`
${i}
`}),r=r.replace(/\\\(([\s\S]*?)\\\)/g,(o,c)=>`$${c.trim()}$`),r=r.replace(/\\\[([\s\S]*?)\\\]/g,(o,c)=>`

$$
${c.trim()}
$$

`),r=r.replace(/\(([^)]*)\)/g,(o,c)=>{const i=c.trim();return/\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right|begin|end)/.test(i)||/[=^_{}]/.test(i)?o.trim()===o&&!o.includes(" ")?`

$$
${i}
$$

`:`$${i}$`:/^[a-zA-Z0-9_\s]+$/.test(i)&&i.length<20?`$${i}$`:o}),r=r.replace(new RegExp("(?<![$\\\\])(\\\\frac{[^}]*}{[^}]*}|\\\\nabla|\\\\partial|\\\\sum|\\\\int|\\\\sqrt{[^}]*}|\\\\mathbb{[A-Z]}|\\\\vec{[a-zA-Z]}|\\\\lim|\\\\begin{[a-zA-Z]*})","g"),o=>`$${o}$`),r=r.replace(/\$\s+/g,"$"),r=r.replace(/\s+\$/g,"$"),r=r.replace(/\$\$\s+/g,"$$"),r=r.replace(/\s+\$\$/g,"$$"),r},D=s=>{if(!s)return"";const r=nt(s);if(!be(r))return ee(r);try{const o=JSON.parse(r),c=ge(o);return ee(c||r)}catch{return ee(r)}},ot=`
  .ai-markdown .katex {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .ai-markdown .katex-display {
    direction: ltr !important;
    unicode-bidi: embed;
    text-align: center !important;
    margin: 0.75em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ai-markdown .katex-display > .katex {
    display: inline-block;
    text-align: left;
  }
  .ai-markdown .katex .mathnormal,
  .ai-markdown .katex .mord,
  .ai-markdown .katex .mbin,
  .ai-markdown .katex .mrel,
  .ai-markdown .katex .mopen,
  .ai-markdown .katex .mclose,
  .ai-markdown .katex .mpunct,
  .ai-markdown .katex .minner {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .dark .ai-markdown {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-primary {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-secondary {
    color: #9ca3af !important;
  }
  .dark .ai-markdown h1,
  .dark .ai-markdown h2,
  .dark .ai-markdown h3,
  .dark .ai-markdown strong {
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown code {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  .dark .ai-markdown blockquote {
    background: rgba(55, 65, 81, 0.5) !important;
    color: #d1d5db !important;
  }
  .dark .ai-markdown table th {
    background: #374151 !important;
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown table td {
    color: #d1d5db !important;
  }
  .dark .ai-markdown table {
    border-color: #4b5563 !important;
  }
  .dark .ai-markdown .border-border-subtle {
    border-color: #374151 !important;
  }
`,it=({content:s,isUser:r=!1})=>{const{theme:o}=Te(),c=l.useMemo(()=>D(s),[s]),[i,v]=Ae.useState(!1),g=o==="dark"||o==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches,S=g?qe:Re,x=async()=>{try{await navigator.clipboard.writeText(s),v(!0),setTimeout(()=>v(!1),2e3)}catch{const a=document.createElement("textarea");a.value=s,document.body.appendChild(a),a.select(),document.execCommand("copy"),document.body.removeChild(a),v(!0),setTimeout(()=>v(!1),2e3)}};return r?e.jsxs("div",{className:"relative group",children:[e.jsx("div",{className:"ai-markdown prose prose-sm max-w-none text-text-primary",children:e.jsx(xe,{remarkPlugins:[he],rehypePlugins:[[ue,{throwOnError:!1,trust:!1,macros:{"\\R":"\\mathbb{R}","\\N":"\\mathbb{N}","\\Z":"\\mathbb{Z}","\\Q":"\\mathbb{Q}"}}]],children:c})}),e.jsx("button",{onClick:x,className:"absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary",title:"کپی پیام",children:i?e.jsx(te,{className:"w-3.5 h-3.5 text-green-500"}):e.jsx(B,{className:"w-3.5 h-3.5"})})]}):c.trim()?e.jsxs("div",{className:"ai-markdown text-sm leading-relaxed break-words w-full max-w-full text-text-primary relative group",children:[e.jsx("style",{children:ot}),e.jsx("button",{onClick:x,className:"absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary z-10",title:"کپی پیام",children:i?e.jsx(te,{className:"w-3.5 h-3.5 text-green-500"}):e.jsx(B,{className:"w-3.5 h-3.5"})}),e.jsx(xe,{remarkPlugins:[he],rehypePlugins:[[ue,{throwOnError:!1,trust:!1,macros:{"\\R":"\\mathbb{R}","\\N":"\\mathbb{N}","\\Z":"\\mathbb{Z}","\\Q":"\\mathbb{Q}"}}]],components:{p:({children:a})=>e.jsx("p",{className:"mb-3 last:mb-0 whitespace-pre-line leading-relaxed text-text-primary",children:a}),ul:({children:a})=>e.jsx("ul",{className:"list-disc pr-5 mb-3 space-y-1.5 text-text-primary",children:a}),ol:({children:a})=>e.jsx("ol",{className:"list-decimal pr-5 mb-3 space-y-1.5 text-text-primary",children:a}),li:({children:a})=>e.jsx("li",{className:"text-text-primary leading-relaxed",children:a}),strong:({children:a})=>e.jsx("strong",{className:"font-bold text-text-primary",children:a}),em:({children:a})=>e.jsx("em",{className:"italic text-text-secondary",children:a}),h1:({children:a})=>e.jsx("h1",{className:"text-xl font-bold mb-3 mt-4 first:mt-0 text-text-primary border-b border-border-subtle pb-2",children:a}),h2:({children:a})=>e.jsx("h2",{className:"text-lg font-bold mb-2.5 mt-3 first:mt-0 text-text-primary",children:a}),h3:({children:a})=>e.jsx("h3",{className:"text-base font-bold mb-2 mt-2.5 first:mt-0 text-text-primary",children:a}),blockquote:({children:a})=>e.jsx("blockquote",{className:"border-r-4 border-accent pr-4 my-3 py-1 bg-surface-2/30 rounded-r-lg text-text-secondary",children:a}),code:({className:a,children:N,...L})=>{if(!a)return e.jsx("code",{className:"bg-surface-3 dark:bg-gray-700 text-accent-hover dark:text-gray-200 px-1.5 py-0.5 rounded-md text-xs font-mono whitespace-pre-wrap break-words",...L,children:N});const p=/language-(\w+)/.exec(a||""),d=p?p[1]:"text",m=String(N).replace(/\n$/,"");return e.jsxs("div",{className:"relative my-3 rounded-xl overflow-hidden border border-border-subtle dark:border-gray-700",children:[e.jsxs("div",{className:"flex items-center justify-between px-4 py-2 bg-surface-3/50 dark:bg-gray-800 border-b border-border-subtle dark:border-gray-700 text-xs text-text-secondary dark:text-gray-400",children:[e.jsx("span",{className:"font-mono uppercase text-[10px] tracking-wider",children:d}),e.jsxs("button",{onClick:()=>navigator.clipboard.writeText(m),className:"flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-3 dark:hover:bg-gray-700 transition-colors text-text-tertiary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200",children:[e.jsx(B,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"text-[10px]",children:"کپی کد"})]})]}),e.jsx(Ee,{language:d,style:S,customStyle:{margin:0,padding:"16px",fontSize:"13px",lineHeight:"1.6",background:g?"#1e1e1e":"#f8f8f8",borderRadius:0},wrapLines:!0,wrapLongLines:!0,children:m})]})},pre:({children:a})=>e.jsx(e.Fragment,{children:a}),table:({children:a})=>e.jsx("div",{className:"overflow-x-auto my-3 rounded-xl border border-border-subtle dark:border-gray-700",children:e.jsx("table",{className:"w-full text-sm border-collapse",children:a})}),th:({children:a})=>e.jsx("th",{className:"border border-border-subtle dark:border-gray-700 px-4 py-2.5 bg-surface-2 dark:bg-gray-800 text-right font-semibold text-text-primary dark:text-gray-200",children:a}),td:({children:a})=>e.jsx("td",{className:"border border-border-subtle dark:border-gray-700 px-4 py-2.5 text-text-secondary dark:text-gray-300",children:a}),hr:()=>e.jsx("hr",{className:"my-4 border-border-subtle dark:border-gray-700"}),a:({href:a,children:N})=>e.jsx("a",{href:a,target:"_blank",rel:"noopener noreferrer",className:"text-accent hover:text-accent-hover underline transition-colors",children:N})},children:c})]}):e.jsxs("div",{className:"flex items-center gap-2 text-amber-600 text-sm",children:[e.jsx(ze,{className:"w-4 h-4 flex-shrink-0"}),e.jsx("span",{children:"پاسخ دریافتی قابل نمایش نبود. لطفاً دوباره تلاش کنید."})]})},dt=()=>{const{user:s}=Le(),{showToast:r}=Oe(),{sessions:o,loading:c,createSession:i,updateSession:v,deleteSession:g,refetch:S}=rt((s==null?void 0:s.id)??null),[x,a]=l.useState([]),[N,L]=l.useState(""),[$,p]=l.useState(!1),[d,m]=l.useState(""),[y,_]=l.useState(null),[J,U]=l.useState(!1),[I,ye]=l.useState("medium"),[X,se]=l.useState(!1),[E,re]=l.useState(!1),[Z,K]=l.useState(""),[we,ae]=l.useState(!1),ne=l.useRef(null),ke=l.useRef(null),oe="https://pebhpwclsnxcokwhligh.supabase.co/functions/v1/ai-assistant",ie=()=>{re(!E)};l.useEffect(()=>{const t=n=>{n.key==="Escape"&&E&&re(!1)};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[E]);const ce=t=>{_(t.id),a(t.messages||[]),U(!1),K("")},je=async()=>{const t=await i({title:"گفتگوی جدید"});t&&(_(t.id),a([]),U(!1),K(""))},Ne=async(t,n)=>{if(n.stopPropagation(),!confirm("آیا از حذف این گفتگو اطمینان دارید؟"))return;await g(t)?(r("گفتگو حذف شد","success"),y===t&&(_(null),a([]),K(""))):r("خطا در حذف گفتگو","error")},P=async(t,n)=>{await v(t,{messages:n})},ve=async(t,n)=>{var f,w;p(!0),m("");const u=!1;try{const{data:{session:T}}=await R.auth.getSession(),k=T==null?void 0:T.access_token,O={...n,complexity:I,stream:!0},j=await fetch(oe,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${k}`},body:JSON.stringify({action:t,data:O})});if(!j.ok){let b=`HTTP error ${j.status}`;try{b=(await j.json()).error||b}catch{b=await j.text()}throw new Error(b)}if((j.headers.get("content-type")||"").includes("application/json")){const b=await j.json();if(b.success)return t==="chat"?((f=b.data)==null?void 0:f.message)||"پاسخی دریافت نشد":D(JSON.stringify(b.data))||"پاسخی دریافت نشد";throw new Error(b.error||"Unknown error")}const M=(w=j.body)==null?void 0:w.getReader();if(!M)throw new Error("No response body");const de=new TextDecoder;let A="",h="";for(;;){const{done:b,value:C}=await M.read();if(b)break;h+=de.decode(C,{stream:!0});const V=h.split(`
`);h=V.pop()||"";for(const me of V)if(me.startsWith("data: "))try{const q=JSON.parse(me.slice(6));if(q.type==="chunk"&&q.content)A+=q.content,m(A);else{if(q.type==="done")return A;if(q.type==="error")throw new Error(q.message||"Unknown error")}}catch{}}return D(A)||"پاسخی دریافت نشد"}catch{const k="ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";return r(k,"error"),`⚠️ ${k}`}finally{p(!1),m("")}},Y=async(t,n)=>{var f,w,T,k,O;p(!0);const u=!1;try{const{data:{session:j}}=await R.auth.getSession(),z=j==null?void 0:j.access_token,M={...n,complexity:I},A=await(await fetch(oe,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${z}`},body:JSON.stringify({action:t,data:M})})).json();if(!A.success){const h=u?A.error||"خطا در پاسخ هوش مصنوعی":"ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";throw new Error(h)}if(t==="chat")return D((f=A.data)==null?void 0:f.message)||"پاسخی دریافت نشد";if(t==="analyze"){const h=A.data;let b=D(h.summary)||"";return(w=h.strengths)!=null&&w.length&&(b+=`

**نقاط قوت:**
`+h.strengths.map(C=>`- ${C}`).join(`
`)),(T=h.weaknesses)!=null&&T.length&&(b+=`

**نقاط ضعف:**
`+h.weaknesses.map(C=>`- ${C}`).join(`
`)),(k=h.recommendations)!=null&&k.length&&(b+=`

**پیشنهادات:**
`+h.recommendations.map(C=>`- ${C}`).join(`
`)),h.motivation&&(b+=`

---

`+h.motivation),b||"تحلیل کامل شد، اما داده‌ای برای نمایش وجود ندارد."}if(t==="recommend"){const h=A.data||{};let C=`**پیشنهادات هوشمند:**
`+(h.recommendations||[]).map(V=>`- ${V}`).join(`
`);return h.insight&&(C+=`

**بینش کلی:** `+h.insight),h.next_step&&(C+=`

**گام بعدی شما:** `+h.next_step),C||"پیشنهادی برای نمایش وجود ندارد."}return t==="summarize"?D((O=A.data)==null?void 0:O.summary)||"خلاصه‌سازی انجام نشد.":"عملیات ناشناخته"}catch{const z="ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.";return r(z,"error"),`⚠️ ${z}`}finally{p(!1)}},Se=async t=>{if(t.preventDefault(),!N.trim()||$)return;let n=y;if(!n){const M=await i({title:N.trim().slice(0,50)});if(!M){r("خطا در ایجاد گفتگو","error");return}n=M.id,_(n)}const u={role:"user",content:N},f=[...x,u];a(f),L(""),await P(n,f);const w=f.map(M=>({role:M.role,content:M.content})),O={role:"assistant",content:await ve("chat",{messages:w,userId:s==null?void 0:s.id})},j=[...f,O];a(j),m(""),await P(n,j);const z=o.find(M=>M.id===n);z&&(!z.title||z.title==="گفتگوی جدید")&&u.content.length>10&&(await v(n,{title:u.content.slice(0,50)+"..."}),S())},$e=[{label:"تحلیل عملکرد ماهانه",icon:e.jsx(Qe,{className:"w-4 h-4"}),description:"دریافت تحلیل کامل عملکرد و نقاط قوت و ضعف",action:async()=>{let t=y;if(!t){const w=await i({title:"تحلیل عملکرد"});if(!w)return;t=w.id,_(t)}const u={role:"assistant",content:await Y("analyze",{userId:s==null?void 0:s.id,period:"month"})},f=[...x,u];a(f),await P(t,f)}},{label:"برنامه مطالعه شخصی‌سازی‌شده",icon:e.jsx(Fe,{className:"w-4 h-4"}),description:"دریافت برنامه مطالعه اختصاصی بر اساس داده‌های شما",action:async()=>{let t=y;if(!t){const w=await i({title:"برنامه مطالعه"});if(!w)return;t=w.id,_(t)}const u={role:"assistant",content:await Y("recommend",{userId:s==null?void 0:s.id,goal:"بهبود عملکرد کلی"})},f=[...x,u];a(f),await P(t,f)}},{label:"نکته انگیزشی روز",icon:e.jsx(Ue,{className:"w-4 h-4"}),description:"یک پیام انگیزشی متناسب با سطح شما",action:async()=>{let t=y;if(!t){const k=await i({title:"انگیزش"});if(!k)return;t=k.id,_(t)}const f=(await Y("analyze",{userId:s==null?void 0:s.id,period:"week"})).split(`
`).filter(k=>k.includes("---")||k.includes("💪")||k.includes("🚀")),w={role:"assistant",content:f.length>0?f.join(`
`):"به راه خود ادامه دهید. هر روز قدمی به جلو! 💪"},T=[...x,w];a(T),await P(t,T)}},{label:"پرسش درسی",icon:e.jsx(Ie,{className:"w-4 h-4"}),description:"سوالات درسی خود را بپرسید و پاسخ دقیق دریافت کنید",action:async()=>{const t=document.querySelector('input[type="text"]');t&&t.focus()}}];l.useEffect(()=>{var t;(t=ne.current)==null||t.scrollIntoView({behavior:"smooth"})},[x,d]),l.useEffect(()=>{if(o.length>0&&!y){const t=o[0];ce(t)}},[o]);const le={simple:"ساده و سریع",medium:"متوسط",advanced:"پیشرفته و تحلیلی"},Me={simple:"پاسخ‌های مختصر و سریع",medium:"پاسخ‌های متعادل",advanced:"تحلیل عمیق با مدل پیشرفته"},Q=l.useMemo(()=>{const t=[...x];if($&&d){const n=t[t.length-1];if((n==null?void 0:n.role)==="assistant"){const u=[...t];return u[u.length-1]={...n,content:d},u}else return[...t,{role:"assistant",content:d}]}return t},[x,$,d]),H=l.useMemo(()=>{if(!Z.trim())return Q;const t=Z.trim().toLowerCase();return Q.filter(n=>n.content.toLowerCase().includes(t))},[Q,Z]),Ce=async()=>{const t=H.map(n=>`${n.role==="user"?"👤 کاربر":"🤖 Repolym"}:
${n.content}`).join(`

---

`);try{await navigator.clipboard.writeText(t),ae(!0),setTimeout(()=>ae(!1),2e3),r("مکالمه کپی شد!","success")}catch{r("خطا در کپی کردن","error")}},_e=E?"fixed inset-0 z-50 bg-surface-1 rounded-none border-0 p-4 sm:p-6 flex flex-col h-screen max-h-none min-h-screen":"bg-surface-1 rounded-2xl border border-border p-4 sm:p-6 flex flex-col h-[75vh] max-h-[700px] min-h-[450px]";return e.jsxs("div",{ref:ke,className:_e,dir:"rtl",children:[e.jsxs("div",{className:"flex items-center justify-between pb-3 border-b border-border mb-3 flex-wrap gap-2 shrink-0",children:[e.jsxs("div",{className:"flex items-center gap-3 min-w-0",children:[e.jsx("button",{onClick:()=>U(!J),className:"p-2 rounded-xl hover:bg-surface-2 transition-colors flex-shrink-0",children:J?e.jsx(G,{className:"w-5 h-5"}):e.jsx(De,{className:"w-5 h-5"})}),e.jsx("div",{className:"p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0",children:e.jsx(pe,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h2",{className:"text-base sm:text-lg font-bold text-text-primary truncate",children:"مربی هوشمند Repolym"}),e.jsx("p",{className:"text-xs sm:text-sm text-text-secondary truncate",children:"دستیار شخصی شما برای موفقیت در المپیاد"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:ie,className:"p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary",title:E?"خروج از تمام صفحه":"تمام صفحه",children:E?e.jsx(et,{className:"w-5 h-5"}):e.jsx(Ye,{className:"w-5 h-5"})}),e.jsxs("div",{className:"relative",children:[e.jsxs("button",{onClick:()=>se(!X),className:`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${X?"border-accent bg-accent-muted text-accent-hover":"border-border hover:bg-surface-2 text-text-secondary"}`,children:[e.jsx(st,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:le[I]})]}),X&&e.jsx("div",{className:"absolute left-0 top-full mt-2 w-52 bg-surface-1 border border-border rounded-xl shadow-lg p-2 z-20",children:["simple","medium","advanced"].map(t=>e.jsxs("button",{onClick:()=>{ye(t),se(!1)},className:`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${I===t?"bg-accent-muted text-accent-hover":"hover:bg-surface-2 text-text-secondary"}`,children:[e.jsx("div",{className:"font-medium",children:le[t]}),e.jsx("div",{className:"text-xs text-text-tertiary",children:Me[t]})]},t))})]}),e.jsxs("button",{onClick:je,className:"flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0 shadow-md",children:[e.jsx(Je,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline",children:"گفتگوی جدید"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-2 mb-3 shrink-0",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Ze,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"}),e.jsx("input",{type:"text",value:Z,onChange:t=>K(t.target.value),placeholder:"جستجو در مکالمات...",className:"w-full bg-surface-2 border border-border rounded-xl px-9 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"})]}),e.jsxs("button",{onClick:Ce,className:"flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border transition-colors text-sm text-text-secondary hover:text-text-primary",title:"کپی کل مکالمه",children:[we?e.jsx(te,{className:"w-4 h-4 text-green-500"}):e.jsx(B,{className:"w-4 h-4"}),e.jsx("span",{className:"hidden sm:inline text-xs",children:"کپی همه"})]}),Z&&e.jsxs("span",{className:"text-xs text-text-tertiary whitespace-nowrap",children:[H.length," از ",Q.length]})]}),e.jsxs("div",{className:"flex flex-1 min-h-0 relative",children:[J&&e.jsxs("div",{className:"absolute inset-0 z-10 bg-surface-1 rounded-2xl border border-border p-3 flex flex-col gap-2 overflow-y-auto",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("h3",{className:"text-sm font-semibold text-text-secondary flex items-center gap-2",children:[e.jsx(Be,{className:"w-4 h-4"}),"تاریخچه گفتگوها"]}),e.jsx("button",{onClick:()=>U(!1),className:"p-1 rounded-lg hover:bg-surface-2",children:e.jsx(G,{className:"w-4 h-4"})})]}),c?e.jsx("div",{className:"text-center py-4 text-text-tertiary",children:"در حال بارگذاری..."}):o.length===0?e.jsxs("div",{className:"text-center py-8 text-text-tertiary text-sm",children:["هنوز گفتگویی ندارید.",e.jsx("br",{}),"با دکمه «گفتگوی جدید» شروع کنید."]}):o.map(t=>e.jsxs("div",{onClick:()=>ce(t),className:`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${t.id===y?"bg-accent-muted":"hover:bg-surface-2"}`,children:[e.jsx("span",{className:"text-sm truncate max-w-[80%]",children:t.title||"گفتگوی جدید"}),e.jsx("button",{onClick:n=>Ne(t.id,n),className:"p-1 rounded-lg text-text-tertiary hover:text-red-500 transition-colors flex-shrink-0",children:e.jsx(Pe,{className:"w-3.5 h-3.5"})})]},t.id))]}),e.jsxs("div",{className:"flex-1 flex flex-col min-h-0",children:[e.jsxs("div",{className:"flex-1 overflow-y-auto overflow-x-hidden space-y-4 mb-4 p-2 bg-surface-2 rounded-xl border border-border/50",children:[H.length===0&&!$?e.jsxs("div",{className:"h-full flex flex-col items-center justify-center text-text-secondary gap-3 p-4 sm:p-6 text-center",children:[e.jsx("div",{className:"w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center",children:e.jsx(pe,{className:"w-8 h-8 text-indigo-600"})}),e.jsx("p",{className:"font-bold text-lg text-text-primary",children:"به مربی هوشمند Repolym خوش آمدید"}),e.jsx("p",{className:"text-sm max-w-sm text-text-secondary",children:"سوالات درسی، تحلیل عملکرد، برنامه مطالعه و نکات انگیزشی — همه در یک جا"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-md",children:$e.map((t,n)=>e.jsxs("button",{onClick:t.action,disabled:$,className:"flex items-center gap-3 bg-surface-1 border border-border hover:border-accent hover:shadow-md rounded-xl px-4 py-3 text-right transition-all disabled:opacity-50",children:[e.jsx("div",{className:"w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600",children:t.icon}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-xs font-bold text-text-primary",children:t.label}),e.jsx("p",{className:"text-2xs text-text-tertiary truncate",children:t.description})]})]},n))})]}):H.map((t,n)=>{const u=t.role==="user";return e.jsx("div",{className:`flex ${u?"justify-start":"justify-end"} w-full`,children:e.jsxs("div",{className:`max-w-[90%] sm:max-w-[85%] min-w-0 rounded-2xl px-3 sm:px-4 py-3 text-sm leading-relaxed shadow-sm ${u?"bg-accent-muted text-accent-hover rounded-tr-none border border-accent-subtle/30":"bg-surface-1 border border-border text-text-primary rounded-tl-none"}`,children:[e.jsx(it,{content:t.content,isUser:u}),n===H.length-1&&$&&d&&!u&&e.jsx("span",{className:"inline-block w-1.5 h-4 bg-accent animate-pulse ml-1"})]})},n)}),$&&!d&&e.jsx("div",{className:"flex justify-end",children:e.jsxs("div",{className:"bg-surface-1 border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-text-secondary shadow-sm",children:[e.jsx(He,{className:"w-4 h-4 animate-spin text-accent"}),e.jsx("span",{children:"در حال نوشتن پاسخ..."})]})}),e.jsx("div",{ref:ne})]}),e.jsxs("form",{onSubmit:Se,className:"flex gap-2 shrink-0",children:[e.jsx("input",{type:"text",value:N,onChange:t=>L(t.target.value),placeholder:"سوال خود را اینجا بنویسید...",disabled:$,className:"flex-1 min-w-0 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50 text-right placeholder-text-tertiary"}),e.jsx("button",{type:"submit",disabled:$||!N.trim(),className:"p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-md",children:e.jsx(We,{className:"w-4 h-4 rotate-180"})})]})]})]}),E&&e.jsx("button",{onClick:ie,className:"absolute top-4 left-4 p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors z-50",title:"خروج از تمام صفحه",children:e.jsx(G,{className:"w-5 h-5"})})]})};export{dt as AiAssistantSection,dt as default};
