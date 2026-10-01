"""Read-only, bounded technical crawl of the public SatvaStones storefront."""
import concurrent.futures, collections, datetime, html.parser, json, pathlib, re, time
import urllib.request, urllib.error, urllib.parse, urllib.robotparser, xml.etree.ElementTree as ET

OUT = pathlib.Path(__file__).parent
OUT.mkdir(exist_ok=True)
BASE = 'https://www.satvastones.in'
AGENT = 'SatvaStonesTechnicalAudit/1.0'
HEADERS = {'User-Agent': AGENT, 'Accept': 'text/html,application/xml,text/plain'}

class Redirects(urllib.request.HTTPRedirectHandler):
    def __init__(self): self.chain = []
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        self.chain.append({'url': req.full_url, 'status': code, 'location': newurl})
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch(url):
    handler = Redirects()
    start = time.monotonic()
    try:
        response = urllib.request.build_opener(handler).open(urllib.request.Request(url, headers=HEADERS), timeout=30)
    except urllib.error.HTTPError as error: response = error
    except Exception as error: return {'url':url, 'error':str(error), 'redirects':handler.chain}, ''
    with response:
        raw = response.read(5_000_000)
        result = {'url':url, 'final_url':response.url, 'status':response.code, 'headers':dict(response.headers), 'bytes':len(raw), 'request_seconds':round(time.monotonic()-start,3), 'redirects':handler.chain}
        return result, raw.decode('utf-8',errors='replace')

class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links=[]; self.images=[]; self.metadata={}; self.canonical=[]; self.schemas=[]; self.h1=[]; self.h2=[]; self.text=[]; self.title=''; self.stack=[]; self.schema_buffer=None; self.styles=[]; self.scripts=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        self.stack.append(tag)
        if tag=='meta': self.metadata[a.get('name',a.get('property',''))]=a.get('content','')
        if tag=='link' and a.get('rel')=='canonical': self.canonical.append(a.get('href',''))
        if tag=='link' and a.get('rel')=='stylesheet': self.styles.append(a.get('href',''))
        if tag=='a' and a.get('href'): self.links.append(a['href'])
        if tag=='img': self.images.append({k:a.get(k) for k in ['src','alt','width','height','loading','fetchpriority','sizes','srcset']})
        if tag=='script':
            if a.get('type')=='application/ld+json': self.schema_buffer=''
            if a.get('src'): self.scripts.append(a['src'])
        if tag in ['meta','link','img','input','hr','br','source']: self.stack.pop()
    def handle_endtag(self,tag):
        if tag=='script' and self.schema_buffer is not None:
            try: self.schemas.append(json.loads(self.schema_buffer))
            except Exception: self.schemas.append({'parse_error':self.schema_buffer[:200]})
            self.schema_buffer=None
        if tag in self.stack:
            index=len(self.stack)-1-self.stack[::-1].index(tag)
            self.stack=self.stack[:index]
    def handle_data(self,data):
        if self.schema_buffer is not None: self.schema_buffer+=data
        if 'title' in self.stack: self.title+=data
        if 'h1' in self.stack: self.h1.append(data)
        if 'h2' in self.stack: self.h2.append(data)
        if not any(t in self.stack for t in ['script','style','head']): self.text.append(data)

robots_result,robots_body=fetch(BASE+'/robots.txt')
(OUT/'live-robots.txt').write_text(robots_body,encoding='utf-8')
robots=urllib.robotparser.RobotFileParser(); robots.parse(robots_body.splitlines())
sitemap_result,sitemap_body=fetch(BASE+'/sitemap.xml')
(OUT/'live-sitemap.xml').write_text(sitemap_body,encoding='utf-8')
try: sitemap_urls=[el.text for el in ET.fromstring(sitemap_body).iter() if el.tag.endswith('loc')]
except Exception: sitemap_urls=[]
seed=[BASE+'/',*sitemap_urls,BASE+'/shop',BASE+'/shop/rings',BASE+'/shop/bracelets',BASE+'/shop/earrings',BASE+'/shop/necklaces',BASE+'/shop/korean-jewellery']
pending=collections.deque(dict.fromkeys(seed)); seen=set(); results=[]; skipped=[]

def allowed(url):
    parsed=urllib.parse.urlparse(url)
    return parsed.scheme in ['http','https'] and parsed.hostname in ['www.satvastones.in','satvastones.in'] and not re.search(r'\.(?:png|jpg|jpeg|webp|svg|pdf|ico|woff2?)$',parsed.path,re.I) and robots.can_fetch(AGENT,url)

def crawl(url):
    time.sleep(1)
    result,body=fetch(url)
    if 'text/html' in result.get('headers',{}).get('Content-Type',''):
        page=Page(); page.feed(body)
        result.update(title=page.title,meta=page.metadata,canonicals=page.canonical,h1=page.h1,h2=page.h2,schemas=page.schemas,images=page.images,links=page.links,scripts=page.scripts,styles=page.styles,visible_word_count=len(' '.join(page.text).split()))
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    while pending and len(seen)<500:
        batch=[]
        while pending and len(batch)<5 and len(seen)<500:
            url=pending.popleft().split('#')[0]
            if url in seen: continue
            if not allowed(url): skipped.append(url); continue
            seen.add(url); batch.append(url)
        for result in pool.map(crawl,batch):
            results.append(result)
            for href in result.get('links',[]):
                target=urllib.parse.urljoin(result.get('final_url',result['url']),href).split('#')[0]
                parsed=urllib.parse.urlparse(target)
                # Follow category/pagination links; avoid unbounded search/sort/filter grids.
                if parsed.query and any(k not in ['category','page'] for k,_ in urllib.parse.parse_qsl(parsed.query)): continue
                if allowed(target) and target not in seen: pending.append(target)
        (OUT/'live-crawl.json').write_text(json.dumps({'analyzed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'robots':robots_result,'sitemap':sitemap_result,'sitemap_url_count':len(sitemap_urls),'crawl_limit':500,'concurrency':5,'request_delay_seconds':1,'pages':results,'skipped_robots_or_nonhtml':list(dict.fromkeys(skipped))},indent=2),encoding='utf-8')
        print(f'Crawled {len(results)} pages; queued {len(pending)}',flush=True)

redirect_checks=[]
for url in ['http://satvastones.in/','http://www.satvastones.in/','https://satvastones.in/','https://www.satvastones.in/','https://www.satvastones.in/qanda','https://www.satvastones.in/product/mini-glass-jar-gift-hamper-red-ribbon','https://www.satvastones.in/__seo_missing_page_2026']:
    time.sleep(1); result,_=fetch(url); redirect_checks.append(result)
(OUT/'live-redirects.json').write_text(json.dumps(redirect_checks,indent=2),encoding='utf-8')
print(json.dumps({'crawled':len(results),'statuses':dict(collections.Counter(str(p.get('status','error')) for p in results)),'sitemap_urls':len(sitemap_urls),'redirect_checks':redirect_checks},indent=2),flush=True)
