let testString = `<a class="custom-hotarea" hotarea="" href="https://huopin.1688.com/group/promotion/nvzhuang.htm?spm=0.0.0.0.NW7sOa" title="伙拼" target="_blank" style="position: absolute; top: 5px; left: 1004px; height: 112px; width: 191px; z-index: 1;"></a>
<a class="custom-hotarea" hotarea="" href="https://518.1688.com/teshe.html?spm=0.0.0.0.NW7sOa" title="特色" target="_blank" style="position: absolute; top: 8px; left: 810px; height: 106px; width: 182px; z-index: 1;"></a>
<a class="custom-hotarea" hotarea="" href="https://518.1688.com/fashion-hz.html?spm=0.0.0.0.NW7sOa" title="杭州" target="_blank" style="position: absolute; top: 5px; left: 605px; height: 110px; width: 194px; z-index: 1;"></a>
<a class="custom-hotarea" hotarea="" href="https://518.1688.com/fashion-sz.html?spm=0.0.0.0.NW7sOa" title="深圳" target="_blank" style="position: absolute; top: 7px; left: 405px; height: 108px; width: 184px; z-index: 1;"></a>
<a class="custom-hotarea" hotarea="" href="https://518.1688.com/fashion-gz.html?spm=a262r.8676422.j2euu1g6.2.Ov2Jae" title="广州" target="_blank" style="position: absolute; top: 9px; left: 210px; height: 104px; width: 178px; z-index: 1;"></a>
<a class="custom-hotarea" hotarea="" href="https://518.1688.com/nv.html?spm=0.0.0.0.NW7sOa" title="主会场" target="_blank" style="position: absolute; top: 7px; left: 1px; height: 108px; width: 195px; z-index: 1;"></a>
`;

// parse the html string and get the json

const parse = require('parse5');

const parseSimpleCssString = (simpleCssString) => {
  const attrSlices = simpleCssString.split(';').map((item) => item.split(':')).filter((item) =>  item.length > 1);
  const result = attrSlices.reduce((accumulate, item) => {
    accumulate[item[0].trim()] = item[1].trim();
    return accumulate;
  }, {});
  return {
    position: result['position'],
    top: parseInt(result['top']),
    left: parseInt(result['left']),
    height: parseInt(result['height']),
    width: parseInt(result['width']),
    zIndex: parseInt(result['z-index'])
  };
};

const parseHotAreaData = (hotAreaDataString) => (parse.parseFragment(hotAreaDataString).childNodes || [])
      .filter((item) => !!item.tagName).map((item) => {
  let result = {
    tagName: item.tagName,
    attrs: item.attrs.reduce((accumulate, props) => {
      accumulate[props.name] = props.value;
      return accumulate;
    }, {})
  };
  result.attrs['cssObject'] = parseSimpleCssString(result.attrs['style']);
  return result;
});

console.log(testString);
const result = parseHotAreaData(testString);
result.forEach((item) => {
  console.log(JSON.stringify(item));
});