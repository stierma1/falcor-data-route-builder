
var chai = require("chai");
var expect = chai.expect;

var parser = require("../../lib/parsers/route-parser");

describe("Parser", () => {
  var validCases = [
    'id.string[{integers:bacon}][{keys:yes}].what["I", "am", "enum"]',
    'id.string[{integers:bacon}][{keys:yes}].what',
    'yes',
    '[{ranges:yes}]',
    '[{integers:yes}]',
    '[{keys:yes}]',
    '["yes", "no"]',
    "['yes', 'no']",
    'yes[{integers:yes}]',
    '[{integers:yes}].yes'
  ]

  validCases.map((str, idx) => {
    it("validates " + idx, () => {
      parser.parse(str);
    })
  })

  var invalidCases = [
    '[{range:yes}]',
    '[{integer:yes}]',
    '[{key:yes}]',
    '[{keys:}]',
    '[keys:yes]',
    '["yes", {integers:idxs}]',
    "[\"yes', 'no']",
    '[yes]'
  ]

  invalidCases.map((str, idx) => {
    it("invalidates " + idx, () => {
      try{
        parser.parse(str)
      } catch(err){
        return;
      }
      throw new Error("Should not have gotten here");
    })
  })

  it("parses", () => {
    var val = parser.parse('id.string[{integers:bacon}][{keys:yes}].what["I", "am", "enum"]');
    expect(val.length).equals(6);
    expect(val[0].type).equals("id");
    expect(val[1].type).equals("id");
    expect(val[2].type).equals("variable");
    expect(val[3].type).equals("variable");
    expect(val[4].type).equals("id");
    expect(val[5].type).equals("enum");
  })

})
