"""Record only PageSpeed/CrUX metrics actually supplied by Google's API."""
import concurrent.futures, datetime, json, pathlib, urllib.request, urllib.parse, urllib.error

def measure(strategy):
    params=urllib.parse.urlencode({'url':'https://www.satvastones.in/','strategy':strategy,'category':'performance'})
    endpoint='https://www.googleapis.com/pagespeedonline/v5/runPagespeed?'+params
    try:
        with urllib.request.urlopen(endpoint,timeout=55) as response:
            data=json.load(response)
            pathlib.Path('audit/pagespeed-'+strategy+'.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
            lighthouse=data.get('lighthouseResult',{}); audits=lighthouse.get('audits',{})
            return {'strategy':strategy,'source':'Google PageSpeed API','performance_score':lighthouse.get('categories',{}).get('performance',{}).get('score'),'lcp_ms':audits.get('largest-contentful-paint',{}).get('numericValue'),'cls':audits.get('cumulative-layout-shift',{}).get('numericValue'),'tbt_ms':audits.get('total-blocking-time',{}).get('numericValue'),'inp_ms':audits.get('interaction-to-next-paint',{}).get('numericValue'),'field_data':data.get('loadingExperience'),'origin_field_data':data.get('originLoadingExperience')}
    except urllib.error.HTTPError as error:
        return {'strategy':strategy,'available':False,'http_status':error.code,'error':error.read().decode('utf-8',errors='replace')[:1000]}
    except Exception as error: return {'strategy':strategy,'available':False,'error':str(error)}

with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(measure,['mobile','desktop']))
summary={'analyzed_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':'https://www.satvastones.in/','measurements':results,'note':'No inferred scores or metrics. Request time from crawl is not LCP/INP/CLS.'}
pathlib.Path('audit/PERFORMANCE-SUMMARY.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
