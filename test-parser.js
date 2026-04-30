const { FlowParser } = require('./node_modules/@react-native/codegen/lib/parsers/flow/parser');
const parser = new FlowParser();
const fs = require('fs');
const content = fs.readFileSync('./node_modules/react-native/src/private/components/virtualview/VirtualViewNativeComponent.js', 'utf8');
const ast = parser.getAst(content, 'test.js');
const types = parser.getTypes(ast);
console.log(Object.keys(types));
