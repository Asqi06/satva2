"""Inspect a small public delivery sample; never modify source images."""
import concurrent.futures, datetime, json, pathlib, urllib.request
targets=[
('homepage hero 640px','https://res.cloudinary.com/dqguetjwm/image/upload/f_auto,q_auto,w_640/v1790162274/satvastones/products/kx7zdzm66s8801vvibpt.webp'),
('mobile product 384px','https://res.cloudinary.com/dqguetjwm/image/upload/f_auto,q_auto,w_384/v1789977043/satvastones/products/cjvv4d7ghtgcskqxzijo.png'),
('desktop product 640px','https://res.cloudinary.com/dqguetjwm/image/upload/f_auto,q_auto,w_640/v1789977043/satvastones/products/cjvv4d7ghtgcskqxzijo.png'),
('category thumbnail 256px','https://res.cloudinary.com/dqguetjwm/image/upload/f_auto,q_auto,w_256/v1777905134/lmejzk8ypnfy2ycfacbs.png')]
def inspect(target):
    label,url=target
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers={'Accept':'image/avif,image/webp,image/*,*/*;q=0.8'}),timeout=25) as r:
            body=r.read(5_000_000)
            return {'label':label,'url':url,'status':r.code,'bytes':len(body),'content_type':r.headers.get('Content-Type'),'cache_control':r.headers.get('Cache-Control')}
    except Exception as e: return {'label':label,'url':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: results=list(pool.map(inspect,targets))
summary={'analyzed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sample_size':len(targets),'images':results}
pathlib.Path('audit/IMAGE-SUMMARY.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
