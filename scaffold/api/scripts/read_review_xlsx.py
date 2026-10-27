"""Read the numbered genealogy review worksheet without executing workbook content."""
import sys, json, re, zipfile, posixpath
import xml.etree.ElementTree as E
N = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def read(path):
    with zipfile.ZipFile(path) as z:
        if sum(i.file_size for i in z.infolist()) > 60_000_000:
            raise ValueError('الملف أكبر من الحد المسموح')
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(x.itertext()) for x in E.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', N)]
        styles = E.fromstring(z.read('xl/styles.xml'))
        fills = styles.findall('s:fills/s:fill', N)
        xfs = styles.findall('s:cellXfs/s:xf', N)
        def color(c):
            xf = xfs[int(c.get('s','0'))]
            fg = fills[int(xf.get('fillId','0'))].find('s:patternFill/s:fgColor',N)
            return fg.get('rgb','').upper() if fg is not None else ''
        book = E.fromstring(z.read('xl/workbook.xml'))
        sheet = next((s for s in book.findall('s:sheets/s:sheet',N) if s.get('name')=='مواضع الشجرة الكبيرة'),None)
        if sheet is None: raise ValueError('ورقة مواضع الشجرة الكبيرة غير موجودة')
        rid=sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        rels=E.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target=next(r.get('Target') for r in rels if r.get('Id')==rid)
        target=target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/'+target)
        rows=[]; seen=set()
        for row in E.fromstring(z.read(target)).findall('s:sheetData/s:row',N):
            cells={}; colors={}
            for c in row.findall('s:c',N):
                col=re.sub(r'\d','',c.get('r',''))
                v=c.find('s:v',N)
                value=v.text if v is not None else ''
                if c.get('t')=='s': value=shared[int(value)]
                elif c.get('t')=='inlineStr': value=''.join(c.find('s:is',N).itertext())
                if c.find('s:f',N) is not None: raise ValueError('يرجى استخدام قيم نصية بدل الصيغ')
                cells[col]=(value or '').strip(); colors[col]=color(c)
            key=cells.get('A','')
            if key=='رقم الموضع': continue
            if not key: continue
            if not re.fullmatch(r'P\d{3,6}',key) or key in seen: raise ValueError('رقم موضع مكرر أو غير صالح: '+key)
            seen.add(key)
            red=any(c in ('FFFFC7CE','00FFC7CE','FFFF0000','00FF0000') for c in colors.values())
            rows.append(dict(position_key=key,original_name=cells.get('B',''),corrected_name=cells.get('J',''),father_ref=cells.get('K',''),father_name=cells.get('L',''),needs_review=red,location=cells.get('E',''),image=cells.get('N',''),colors=colors,source_cells=cells))
        if not rows or len(rows)>5000: raise ValueError('عدد المواضع غير صالح')
        return rows
if __name__=='__main__':
    try: print(json.dumps(read(sys.argv[1]),ensure_ascii=False))
    except Exception as e:
        print(str(e),file=sys.stderr); sys.exit(1)
