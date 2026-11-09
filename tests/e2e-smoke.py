# Smoke/attack test against a RUNNING site. It creates test users/orders/reviews, so run it only against a
# disposable copy of the database.   Usage:  E2E_BASE=http://127.0.0.1:3000 E2E_ADMIN_PASSWORD=... python3 tests/e2e-smoke.py
import json, os, re, sys, urllib.request, urllib.error
BASE=os.environ.get("E2E_BASE","http://127.0.0.1:3000")
ADMIN_PW=os.environ["E2E_ADMIN_PASSWORD"]
res=[]
def T(name, ok, info=""):
    ok=bool(ok); res.append(ok); print(("PASS " if ok else "FAIL ")+name+(f"   [{info}]" if (info and not ok) else ""))

def req(method, path, body=None, cookie=None, origin=BASE, raw=None, ctype="application/json"):
    h={}
    if cookie: h["Cookie"]=cookie
    if origin and method!="GET": h["Origin"]=origin
    data=None
    if raw is not None: data=raw; h["Content-Type"]=ctype
    elif body is not None: data=json.dumps(body).encode(); h["Content-Type"]="application/json"
    r=urllib.request.Request(BASE+path,data=data,method=method,headers=h)
    try:
        resp=urllib.request.urlopen(r)
    except urllib.error.HTTPError as e:
        resp=e
    text=resp.read()
    try: txt=text.decode()
    except: txt=""
    try: js=json.loads(txt)
    except: js=None
    return resp.status, resp.headers, txt, js, text

def login(phone,pw):
    s,h,t,j,_=req("POST","/api/auth/login",{"phone":phone,"password":pw})
    ck=None
    for k,v in h.items():
        if k.lower()=="set-cookie": ck=v.split(";")[0]; flags=v
    return s,j,ck,(h.get("Set-Cookie") or "")

def pdata(cookie):
    j=req("GET","/api/panel/data",cookie=cookie)[3]
    return (j or {}).get("data", j)

def mut(cookie, action, id=None, data=None, **extra):
    b={"action":action}
    if id is not None: b["id"]=id
    if data is not None: b["data"]=data
    b.update(extra)
    s,h,t,j,_=req("POST","/api/panel/mutate",b,cookie)
    return s,j

print("\n===== SEO =====")
pages=["/","/product/bouquet-pink-roses","/category/seasonal","/category/plant","/category/dried","/blog","/blog/rose-care","/about","/contact","/shipping-returns","/terms","/privacy"]
for p in pages:
    s,h,t,j,_=req("GET",p)
    title=(re.search(r"<title>(.*?)</title>",t,re.S) or [None,""])[1]
    canon=re.search(r'<link rel="canonical" href="([^"]+)"',t)
    ld=re.findall(r'<script type="application/ld\+json">(.*?)</script>',t,re.S)
    okjson=True
    for x in ld:
        try: json.loads(x)
        except Exception: okjson=False
    h1=len(re.findall(r"<h1[ >]",t))
    brand=title.count("گلستان حافظ")
    T(f"{p}: 200", s==200, s)
    T(f"{p}: title present & brand<=1", bool(title) and brand<=1 and len(title)<=75, f"{title!r} len={len(title)}")
    T(f"{p}: canonical", bool(canon), "")
    T(f"{p}: JSON-LD valid ({len(ld)} blocks)", okjson and (len(ld)>0 or p in ("/",) ) , "")
    T(f"{p}: exactly one <h1>", h1==1, h1)
for p in ["/nonexistent-page","/product/nope","/category/nope","/blog/nope"]:
    s,h,t,_,_=req("GET",p); T(f"{p}: real 404", s==404, s)
s,h,t,_,_=req("GET","/product/bouquet-pink-roses")
T("product: Product JSON-LD with IRR offer", '"@type":"Product"' in t and '"priceCurrency":"IRR"' in t)
T("product: no fake aggregateRating when no real reviews", "aggregateRating" not in t)
T("product: description (meta) present", 'name="description"' in t)
s,h,t,_,_=req("GET","/sitemap.xml"); locs=re.findall(r"<loc>(.*?)</loc>",t)
T(f"sitemap has {len(locs)} URLs incl products/blog/legal", len(locs)>=25 and any("/product/" in l for l in locs) and any("/blog/" in l for l in locs) and any("/privacy" in l for l in locs))
s,h,t,_,_=req("GET","/robots.txt")
T("robots: Disallow /api/ + Allow /api/images/ + Sitemap", "Disallow: /api/" in t and "Allow: /api/images/" in t and "Sitemap:" in t)
s,h,t,_,_=req("GET","/")
hd={k.lower():v for k,v in h.items()}
T("header: CSP", "content-security-policy" in hd and "frame-ancestors 'none'" in hd["content-security-policy"])
T("header: X-Frame-Options/nosniff/Referrer-Policy", hd.get("x-frame-options")=="DENY" and hd.get("x-content-type-options")=="nosniff" and "referrer-policy" in hd)
T("header: no X-Powered-By", "x-powered-by" not in hd)
T("header: no CSP upgrade-insecure-requests (localhost-safe)", "upgrade-insecure-requests" not in hd["content-security-policy"])

print("\n===== SECURITY / FUNCTIONAL =====")
s,j,admin,setck=login("09121111111",ADMIN_PW)
T("admin login ok", s==200 and admin, s)
T("cookie HttpOnly + SameSite=lax", "HttpOnly" in setck and "SameSite=lax" in setck, setck)
T("login wrong password -> 401", login("09121111111","wrong-password")[0]==401)
s,h,t,_,_=req("POST","/api/auth/login",{"phone":"09121111111","password":"x"},origin="https://evil.com")
T("cross-origin login blocked (CSRF)", s==403, s)
s,h,t,j,_=req("GET","/api/panel/data"); T("panel/data unauthenticated -> 401", s==401, s)

# brute force: 10 wrong tries on an unknown phone -> 429
codes=[login("09999999999","bad-password-1")[0] for _ in range(10)]
T("login brute-force throttled (429 appears)", 429 in codes, codes)

# register users
pw="Passw0rd!x"
s,h,t,j,_=req("POST","/api/auth/register",{"name":"کاربر تست یک","phone":"09350000001","password":pw})
T("register A ok (weak-pw check next)", s==200, (s,t[:100]))
s,h,t,j,_=req("POST","/api/auth/register",{"name":"x y z","phone":"09350000009","password":"abc12"})
T("register with 5-char password rejected", s==400, s)
s,jA,cA,_=login("09350000001",pw); T("user A login", s==200 and cA, s)
req("POST","/api/auth/register",{"name":"کاربر تست دو","phone":"09350000002","password":pw})
s,jB,cB,_=login("09350000002",pw)
meA=jA["user"]; 
T("signup gift is OFF by default (wallet=0)", meA.get("walletBalance",-1)==0, meA.get("walletBalance"))
T("role is 'user' (cannot self-assign admin)", meA["role"]=="user")
s,h,t,j,_=req("POST","/api/auth/register",{"name":"hack er","phone":"09350000003","password":pw,"role":"admin"})
s,jH,cH,_=login("09350000003",pw); T("register with role=admin in body ignored", jH and jH["user"]["role"]=="user")

# BFLA / privilege escalation
s,j=mut(cA,"wallet.charge",data={"amount":9999999}); T("wallet.charge free money -> blocked", s==403, (s,j))
s,j=mut(cA,"product.update","anything",{"price":1}); T("user product.update -> 403", s==403, s)
s,j=mut(cA,"coupon.create",data={"code":"FREE","title":"x","type":"percent","value":100}); T("user coupon.create -> 403", s==403, s)
s,j=mut(cA,"settings.update",data={"shippingFee":0}); T("user settings.update -> 403", s==403, s)
s,j=mut(cA,"customer.update",jB["user"]["id"],{"wallet":99999999}); T("user customer.update (give self money) -> 403", s==403, s)

# tickets IDOR
s,j=mut(cB,"ticket.create",data={"subject":"مشکل","body":"متن تیکت کاربر دو"}); tk=j and j.get("data",{}).get("id")
T("user B creates ticket", s==200 and tk, (s,j))
s,j=mut(cA,"ticket.delete",tk); T("user A cannot delete B's ticket -> 403", s==403, s)
s,j=mut(cA,"ticket.setStatus",tk,status="closed"); T("user A cannot change B's ticket status -> 403", s==403, s)

# address mass assignment
s,j=mut(cA,"address.create",data={"title":"خانه","receiver":"الف","phone":"09350000001","province":"تهران","city":"تهران","line":"خیابان آزمون پلاک ۱"})
aid=(j or {}).get("data",{}).get("id"); T("address.create", s==200 and aid, (s,j))
s,j=mut(cA,"address.update",aid,{"title":"خانه۲","userId":jB["user"]["id"],"id":"hacked"})
jd=pdata(cA); t2=json.dumps(jd)
mine=[a for a in jd["addresses"] if a["id"]==aid]
T("address.update ignores userId/id (mass assignment)", len(mine)==1 and mine[0]["title"]=="خانه۲")
jdB=pdata(cB)
T("user B does not see A's address", all(a["id"]!=aid for a in jdB["addresses"]))

# data leak checks
T("user panel hides zarinpal merchant id", jd["settings"].get("zarinpalMerchantId","")=="" )
T("user panel does not list all customers/messages", jd["customers"]==[] and jd.get("messages",[])==[] )
jda=pdata(admin); t2=json.dumps(jda)
T("admin panel sees customers", len(jda["customers"])>=3)
T("password hashes never exposed", "password" not in t2 and "password" not in json.dumps(jd))

# products
s,h,t,j,_=req("GET","/api/products"); prods=j["products"]; P=[p for p in prods if p["stock"]>=5][0]
T("products API ok, ratings are 0 (no real reviews)", s==200 and all(p["rating"]==0 and p["reviews"]==0 for p in prods))
base={"receiverName":"گیرنده","phone":"09350000001","address":"تهران، خیابان آزمون، پلاک ۱۲، واحد ۳","city":"تهران","province":"تهران","paymentMethod":"cod"}
def order(items,cookie=cA,**kw):
    b=dict(base); b.update(kw); b["items"]=items
    s,h,t,j,_=req("POST","/api/orders",b,cookie); return s,j
s,j=order([{"productId":P["id"],"qty":"abc"}]); T("order qty='abc' -> 400", s==400, (s,j))
s,j=order([{"productId":P["id"],"qty":-5}]); T("order qty=-5 -> 400", s==400, (s,j))
s,j=order([{"productId":P["id"],"qty":None}]); T("order qty=null -> 400", s==400, (s,j))
s,j=order([]); T("empty cart -> 400", s==400, (s,j))
s,j=order([{"productId":P["id"],"qty":1}],cookie=None); T("order without login -> 401", s==401, s)
stock0=P["stock"]
s,j=order([{"productId":P["id"],"qty":2},{"productId":P["id"],"qty":3}]); 
T("duplicate lines merged into one qty (5)", s==200, (s,j))
code=j and j.get("code"); oid=j and j.get("orderId")
s,h,t,jp,_=req("GET","/api/products"); stock1=[p for p in jp["products"] if p["id"]==P["id"]][0]["stock"]
T(f"stock decremented by 5 ({stock0}->{stock1})", stock0-stock1==5, stock1)
# wallet overspend
s,j=order([{"productId":P["id"],"qty":1}],paymentMethod="wallet"); T("wallet order with 0 balance -> 402", s==402, (s,j))
# online payment in production: sandbox must be unavailable
s,j=order([{"productId":P["id"],"qty":1}],paymentMethod="online")
T("online payment w/o real gateway: sandbox NOT usable in production", (s!=200) or not (j or {}).get("paymentUrl"), (s,j))
s,h,t,j,_=req("POST","/api/payment",{"action":"verify","authority":"A00000000000000000000000000000000000","outcome":"success"},cA)
T("self-confirm payment (verify/success) rejected", s in (400,403,404), (s,j))
s,h,t,j,_=req("POST","/api/payment",{"action":"wallet-charge","amount":50000},cA)
T("wallet top-up cannot self-confirm in production", not ((j or {}).get("success") and not (j or {}).get("paymentUrl") and not (j or {}).get("redirectUrl")) , (s,j))
wb=pdata(cA)["profile"]["walletBalance"]; T("wallet still 0 after attacks", wb==0, wb)

# tracking privacy
s,h,t,j,_=req("GET",f"/api/orders?code={code}")
T("anonymous tracking: name & address masked", s==200 and "★" in j["order"]["customerName"] and j["order"]["address"].endswith("…"), j)
s,h,t,j,_=req("GET",f"/api/orders?code={code}",cookie=cA); T("owner tracking: full details", s==200 and j["order"]["address"].startswith("تهران، خیابان آزمون"), j)
s,h,t,j,_=req("GET",f"/api/orders?code={code}",cookie=cB); T("other user sees masked data", "★" in j["order"]["customerName"])
codes=[req("GET","/api/orders?code=GH-AAAAAA")[0] for _ in range(25)]; T("tracking enumeration throttled (429)", 429 in codes, set(codes))

# cancel: refunds stock exactly once
s,j=mut(cB,"order.cancel",oid); T("user B cannot cancel A's order -> 403", s==403, s)
s,j=mut(cA,"order.cancel",oid); T("owner cancels order", s==200, (s,j))
s,j=mut(cA,"order.cancel",oid); T("double-cancel refused", s in (400,409), (s,j))
s,h,t,jp,_=req("GET","/api/products"); stock2=[p for p in jp["products"] if p["id"]==P["id"]][0]["stock"]
T(f"stock restored exactly once ({stock1}->{stock2})", stock2==stock0, stock2)

# reviews
s,j=mut(cA,"review.create",data={"productId":P["id"],"rating":5,"comment":"گل‌ها خیلی تازه و بسته‌بندی عالی بود"}); rid=(j or {}).get("data",{}).get("id")
T("review.create (name/image from DB)", s==200 and rid, (s,j))
s,j=mut(cA,"review.create",data={"productId":P["id"],"rating":5,"comment":"دوباره"}); T("second review same product -> 409", s==409, s)
s,h,t,j,_=req("GET","/api/reviews"); T("pending review not public", j["reviews"]==[])
s,j=mut(cA,"review.setStatus",rid,status="approved"); T("user cannot approve own review -> 403", s==403, s)
s,j=mut(admin,"review.setStatus",rid,status="approved"); T("admin approves review", s==200)
s,h,t,j,_=req("GET","/api/reviews"); T("approved review public, first-name only", len(j["reviews"])==1 and " " not in j["reviews"][0]["author"], j)
s,h,t,_,_=req("GET",f"/product/{P['slug']}")
T("product page shows review + aggregateRating (visible+schema consistent)", "گل‌ها خیلی تازه" in t and "aggregateRating" in t)
s,h,t,jp,_=req("GET","/api/products"); T("real rating appears in products API", [p for p in jp["products"] if p["id"]==P["id"]][0]["reviews"]==1)

# newsletter
s,h,t,j,_=req("POST","/api/newsletter",{"email":"not-an-email"}); T("newsletter invalid email -> 400", s==400, s)
s,h,t,j,_=req("POST","/api/newsletter",{"email":"reader@example.com"}); T("newsletter subscribe ok", s==200, (s,t))
req("POST","/api/newsletter",{"email":"reader@example.com"})
jm=pdata(admin)
subs=[m for m in jm.get("messages",[]) if m.get("body")=="reader@example.com"]
T("newsletter email stored once in admin inbox", len(subs)==1, len(subs))

# upload
png=bytes([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])+b"\x00"*40
def upload(cookie,name,data,mime):
    bd="----b"; body=(f"--{bd}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: {mime}\r\n\r\n").encode()+data+f"\r\n--{bd}--\r\n".encode()
    s,h,t,j,_=req("POST","/api/upload",cookie=cookie,raw=body,ctype=f"multipart/form-data; boundary={bd}"); return s,j
s,j=upload(None,"a.png",png,"image/png"); T("upload anonymous -> 403", s==403, s)
s,j=upload(cA,"a.png",png,"image/png"); T("upload normal user -> 403", s==403, s)
s,j=upload(admin,"x.svg",b'<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',"image/svg+xml"); T("admin SVG upload rejected", s==400, (s,j))
s,j=upload(admin,"x.png",b'<html><script>alert(1)</script></html>',"image/png"); T("HTML disguised as png rejected", s==400, (s,j))
s,j=upload(admin,"ok.png",png,"image/png"); iu=(j or {}).get("url"); T("admin PNG upload ok", s==200 and iu, (s,j))
s,h,t,_,rb=req("GET",iu); hd={k.lower():v for k,v in h.items()}
T("served image: nosniff + sandbox CSP + image/png", s==200 and hd.get("x-content-type-options")=="nosniff" and "sandbox" in hd.get("content-security-policy","") and hd.get("content-type")=="image/png", hd)
s,h,t,_,_=req("GET","/api/images/..%2f..%2fetc%2fpasswd"); T("image id path traversal -> 404", s==404, s)

# sessions & password change
s,j,cA2,_=login("09350000001",pw)
s,h,t,j,_=req("POST","/api/panel/mutate",{"action":"auth.changePassword","data":{"current":pw,"next":"short"}},cA2); T("change password: too short rejected", s==400, s)
s,h,t,j,_=req("POST","/api/panel/mutate",{"action":"auth.changePassword","data":{"current":"wrong-current","next":"NewPassw0rd!"}},cA2); T("change password: wrong current rejected", s==400, s)
r=req("POST","/api/panel/mutate",{"action":"auth.changePassword","data":{"current":pw,"next":"NewPassw0rd!"}},cA2)
T("change password ok", r[0]==200, r[0])
newck=None
for k,v in r[1].items():
    if k.lower()=="set-cookie": newck=v.split(";")[0]
T("current session re-issued after password change", bool(newck))
s,h,t,j,_=req("GET","/api/auth/me",cookie=cA); T("OLD session (other device) revoked after password change", s==401 or not (j or {}).get("user"), (s,t[:80]))
s,h,t,j,_=req("GET","/api/auth/me",cookie=newck); T("new session works", s==200 and (j or {}).get("user"), s)
T("old password no longer works", login("09350000001",pw)[0]==401)

# admin-only secrets: tamper cookie
bad=admin[:-4]+"AAAA"; s,h,t,j,_=req("GET","/api/panel/data",cookie=bad); T("tampered session cookie rejected", s==401, s)
# CSRF on mutate
s,h,t,j,_=req("POST","/api/panel/mutate",{"action":"profile.update","data":{"name":"hacked name"}},cookie=newck,origin="https://evil.com"); T("cross-origin mutate blocked", s==403, s)
# admin creates customer: strong generated password returned
s,j=mut(admin,"customer.create",data={"name":"مشتری جدید","phone":"09351112233"})
ip=(j or {}).get("data",{}).get("initialPassword",""); T("customer.create: random strong initial password (no default)", len(ip)>=10 and ip!="golestan1234", ip)
s,jx,cx,_=login("09351112233",ip); T("admin-created customer can log in with generated password", s==200, s)
s,j=mut(admin,"customer.update",jx["user"]["id"],{"password":"AdminSet-Pass9","name":"مشتری جدید","phone":"09351112233"})
T("admin can reset a customer's password", s==200 and login("09351112233","AdminSet-Pass9")[0]==200, (s,j))

print(f"\n===== RESULT: {sum(res)}/{len(res)} passed =====")
sys.exit(0 if all(res) else 1)
