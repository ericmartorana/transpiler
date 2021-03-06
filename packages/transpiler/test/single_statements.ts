import {expect} from "chai";
import {ITranspilerOptions} from "../src";
import {UniqueIdentifier} from "../src/unique_identifier";
import {runSingle} from "./_utils";

describe("Single statements", () => {
  const tests = [
    {abap: "DATA foo TYPE i.",                     js: "let foo = new abap.types.Integer();",       skip: false},
    {abap: "foo = 2.",                             js: "foo.set(constant_2);",                      skip: false},
    {abap: "foo = bar + 2.",                       js: "foo.set(bar.add(constant_2));",             skip: false},
    {abap: "foo = bar - 2.",                       js: "foo.set(bar.minus(constant_2));",           skip: false},
    {abap: "foo = bar * 2.",                       js: "foo.set(bar.multiply(constant_2));",        skip: false},
    {abap: "foo = bar / 2.",                       js: "foo.set(bar.divide(constant_2));",          skip: false},
    {abap: "ADD 2 to foo.",                        js: "foo.set(foo.add(2));",                      skip: true},
    {abap: "foo = bar + moo.",                     js: "foo.set(bar.add(moo));",                    skip: false},
    {abap: "DATA foo TYPE i VALUE 2.",             js: "let foo = new abap.types.Integer();\nfoo.set(2);", skip: false},
    {abap: "IF foo = bar. ENDIF.",                 js: "if (abap.compare.eq(foo, bar)) {\n}",       skip: false},
    {abap: "IF foo EQ bar. ENDIF.",                js: "if (abap.compare.eq(foo, bar)) {\n}",       skip: false},
    {abap: "IF foo CP 'bar*'. ENDIF.",             js: "if (abap.compare.cp(foo, 'bar*')) {\n}",    skip: false},
    {abap: "EXIT.",                                js: "break;",                                    skip: false},
    {abap: "CONTINUE.",                            js: "continue;",                                 skip: false},
    {abap: "CASE bar. ENDCASE.",                   js: "let unique1 = bar;",                        skip: false},
    {abap: "DATA foo TYPE c.",                     js: "let foo = new abap.types.Character();",     skip: false},
    {abap: "DATA foo TYPE string.",                js: "let foo = new abap.types.String();",        skip: false},
    {abap: "DATA foo TYPE c LENGTH 2.",            js: "let foo = new abap.types.Character({length: 2});",       skip: true},
    {abap: "DATA foo TYPE c LENGTH 2 VALUE 'fo'.", js: "let foo = new abap.types.Character({length: 2});\nfoo.set('fo');", skip: true},
    {abap: "foo = 'fo'.",                          js: "foo.set('fo');",                            skip: false},
    {abap: "foo = |fo|.",                          js: "foo.set(`fo`);",                            skip: false},
    {abap: "foo = |fo{ 2 }|.",                     js: "foo.set(`fo${constant_2.get()}`);",               skip: false},
    {abap: "foo = `fo`.",                          js: "foo.set(`fo`);",                            skip: false},
    {abap: "foo = bar+1.",                         js: "foo.set(bar.get({offset: 1}));",            skip: false},
    {abap: "foo = bar(1).",                        js: "foo.set(bar.get({length: 1}));",            skip: false},
    {abap: "foo = bar+1(1).",                      js: "foo.set(bar.get({offset: 1, length: 1}));", skip: false},
    {abap: "IF foo IS INITIAL. ENDIF.",            js: "if (abap.compare.initial(foo)) {\n}",       skip: false},
    {abap: "IF foo IS NOT INITIAL. ENDIF.",        js: "if (abap.compare.initial(foo) === false) {\n}", skip: false},
    {abap: "IF NOT foo IS INITIAL. ENDIF.",        js: "if (abap.compare.initial(foo) === false) {\n}", skip: false},
    {abap: "DO. ENDDO.",                           js: "for (;;) {\n}",                                 skip: true},
    {abap: "DO 5 TIMES. ENDDO.",                   js: "for (let unique1 = 0; unique1 < constant_5.get(); unique1++) {\n  abap.builtin.sy.get().index.set(unique1 + 1);\n}",         skip: false},
    {abap: "DO foo TIMES.  ENDDO.",                js: "for (let unique1 = 0; unique1 < foo.get(); unique1++) {\n  abap.builtin.sy.get().index.set(unique1 + 1);\n}", skip: false},
    {abap: "LOOP AT table INTO line. ENDLOOP.",    js: "for (let unique1 of table.array()) {\n  line.set(unique1);\n}",          skip: false},
    {abap: "WHILE foo = bar. ENDWHILE.",           js: "while (abap.compare.eq(foo, bar)) {\n}",    skip: false},
    {abap: "foo-bar = 2.",                         js: "foo.bar.set(2);",                           skip: true}, // hmm, will this kind of member access work?
    {abap: "CLEAR foo.",                           js: "abap.statements.clear(foo);",               skip: false},
    {abap: "SORT foo.",                            js: "abap.statements.sort(foo);",                skip: false},
    {abap: "WRITE foo.",                           js: "abap.statements.write(foo);",               skip: false},
    {abap: "WRITE / foo.",                         js: "abap.statements.write(foo, {newLine: true});", skip: false},
    {abap: "CLASS lcl_foo IMPLEMENTATION. ENDCLASS.", js: "class lcl_foo {\n}",                        skip: false}, // note: no code for the CLASS DEFINITION
    {abap: "CLASS LCL_FOO IMPLEMENTATION. ENDCLASS.", js: "class lcl_foo {\n}",                        skip: false},
    {abap: "RETURN.",                                 js: "return;",                                   skip: false}, // todo, hmm? some more to be added here
    {abap: "method( ).",                              js: "this.method();",                            skip: false},
    {abap: "foo->method( ).",                         js: "foo.get().method();",                       skip: false},
    {abap: "super->method( ).",                       js: "super.get().method();",                     skip: false}, // todo, super is special???
    {abap: "foo->method( 1 ).",                       js: "foo.get().method(constant_1);",                      skip: true}, // todo, hmm, need to know the default parameter name?
    {abap: "foo->method( bar = 2 moo = 1 ).",         js: "foo.get().method({bar: constant_2, moo: constant_1});",       skip: false},
    {abap: "moo = foo->method( ).",                   js: "moo.set(foo.get().method());",              skip: false},
    {abap: "FORM foo. ENDFORM.",                      js: "function foo() {\n}",                       skip: false},
    {abap: "PERFORM foo.",                            js: "foo();",                       skip: false},
    {abap: "DATA foo TYPE STANDARD TABLE OF string.", js: "let foo = new abap.types.Table(new abap.types.String());",         skip: false},
    {abap: "lv_char = lines( lt_words ).",            js: "lv_char.set(abap.builtin.lines(lt_words));",                     skip: false},
    {abap: "SPLIT foo AT bar INTO TABLE moo.",        js: "abap.statements.split({source: foo, at: bar, target: moo});",    skip: false},
    {abap: "WRITE |moo|.",                            js: "abap.statements.write(`moo`);",                                  skip: false},
    {abap: "DELETE foo WHERE bar = 2.",               js: "abap.statements.deleteInternal(foo,{where: (i) => {return abap.compare.eq(i.bar, constant_2);}});", skip: false},
    {abap: "DELETE ADJACENT DUPLICATES FROM foo.",    js: "abap.statements.deleteInternal(foo,{adjacent: true});",          skip: false},
    {abap: "DELETE foo INDEX 2.",                     js: "abap.statements.deleteInternal(foo,{index: constant_2});",       skip: false},
    {abap: "* comment",                               js: "// * comment",                                                   skip: true},
    {abap: "ASSERT foo = bar.",                       js: "abap.statements.assert(abap.compare.eq(foo, bar));",             skip: false},
    {abap: "ASSERT sy-subrc = 0.",                    js: "abap.statements.assert(abap.compare.eq(abap.builtin.sy.get().subrc, constant_0));",            skip: false},
    {abap: "ASSERT 0 = 1.",                           js: "abap.statements.assert(abap.compare.eq(constant_0, constant_1));",                         skip: false},
    {abap: "APPEND lv_word TO lt_letters.",           js: "abap.statements.append({source: lv_word, target: lt_letters});",         skip: false},
    {abap: "APPEND INITIAL LINE TO tab ASSIGNING <fs>.", js: "fs_fs_ = tab.appendInitial();",         skip: false},
    {abap: "WRITE |foo{ lines( lt_words ) }bar|.",    js: "abap.statements.write(`foo${abap.builtin.lines(lt_words).get()}bar`);",  skip: false},
    {abap: "ASSERT 'a' < 'b'.",                       js: "abap.statements.assert(abap.compare.lt('a', 'b'));",    skip: false},
    {abap: "rs_response-body = 'hello'.",             js: "rs_response.get().body.set('hello');",                  skip: false},
    {abap: "TYPES foo TYPE c.",                       js: "",                                                      skip: false}, // yes, skip TYPES
    {abap: "IF ls_request-body = ''.\nENDIF.",        js: "if (abap.compare.eq(ls_request.get().body, '')) {\n}",  skip: false},
    {abap: "CONCATENATE 'foo' 'bar' INTO target.",    js: "abap.statements.concatenate({source: ['foo','bar'], target: target});", skip: false},
    {abap: "zcl_bar=>do_something( ).",               js: "zcl_bar.do_something();",                               skip: false},
    {abap: "SET BIT foo OF bar.",                     js: "abap.statements.setBit(foo, bar);",                     skip: false},
    {abap: "SET BIT foo OF bar TO moo.",              js: "abap.statements.setBit(foo, bar, moo);",                skip: false},
    {abap: "GET BIT foo OF bar INTO moo.",            js: "abap.statements.getBit(foo, bar, moo);",                skip: false},
    {abap: "WRITE sy-index.",                         js: "abap.statements.write(abap.builtin.sy.get().index);",   skip: false},
    {abap: "FIELD-SYMBOLS <bar> TYPE i.",             js: "let fs_bar_ = undefined;",                              skip: false},
    {abap: "ASSIGN da TO <name>.",                    js: "fs_name_ = da;",                                        skip: false},
    {abap: "ASSERT <name> = 1.",                      js: "abap.statements.assert(abap.compare.eq(fs_name_, constant_1));", skip: false},
    {abap: "<name> = 1.",                             js: "fs_name_.set(constant_1);",                                      skip: false},
    {abap: "CONSTANTS c TYPE i VALUE 1.",             js: "let c = new abap.types.Integer();\nc.set(1);",           skip: false},
    {abap: "READ TABLE tab INDEX i INTO target.",     js: "target.set(abap.statements.readTable(tab,{index: i}));", skip: false},
    {abap: "READ TABLE tab INDEX i ASSIGNING <nam>.", js: "fs_nam_ = abap.statements.readTable(tab,{index: i});",   skip: false},
    {abap: "MODIFY result INDEX 1 FROM 4.",           js: "abap.statements.modifyInternal(result,{index: constant_1,from: constant_4});",   skip: false},
    {abap: "WRITE |foo| && |bar|.",                   js: "abap.statements.write(`foo` + `bar`);",                 skip: false},
    {abap: "lv_index = foo - 1 + lv_distance.",       js: "lv_index.set(foo.minus(constant_1.add(lv_distance)));", skip: false},
    {abap: "WRITE zcl_name=>c_maxbits.",              js: "abap.statements.write(zcl_name.c_maxbits);",            skip: false},
    {abap: "WRITE |`|.",                              js: "abap.statements.write(`\\``);",                         skip: false},
    {abap: "ASSERT NOT act IS INITIAL.",              js: "abap.statements.assert(abap.compare.initial(act) === false);", skip: false},
    {abap: "* comment",                               js: "",                    skip: false},
    {abap: "\" comment",                              js: "",                    skip: false},
    {abap: "WRITE '@KERNEL let arr = 2;'.",           js: "let arr = 2;",        skip: false},
    {abap: "WRITE foo->bar.",                         js: "abap.statements.write(foo.get().bar);",        skip: false},
    {abap: "type->type_kind = 2.",                    js: "type.get().type_kind.set(constant_2);",         skip: false},
    {abap: "REPLACE ALL OCCURRENCES OF |\\n| IN lv_norm WITH | |.",              js: "abap.statements.replace(lv_norm, `\\n`, ` `);",         skip: false},
    {abap: "CONDENSE lv_norm.",                                                  js: "abap.statements.condense(lv_norm);",         skip: false},

    {abap: "FIND FIRST OCCURRENCE OF |bar| IN |foobar| MATCH OFFSET lv_offset.",
      js: "abap.statements.find(`foobar`, {find: `bar`, offset: lv_offset});", skip: false},
    {abap: "FIND FIRST OCCURRENCE OF cl_abap_char_utilities=>cr_lf IN iv_string.",
      js: `abap.statements.find(iv_string, {find: cl_abap_char_utilities.cr_lf});`, skip: false},
    {abap: "FIND FIRST OCCURRENCE OF REGEX 'b+c' IN 'abcd' MATCH COUNT lv_cnt MATCH LENGTH lv_len.",
      js: "abap.statements.find('abcd', {regex: 'b+c', count: lv_cnt, length: lv_len});", skip: false},

    {abap: "SHIFT lv_bitbyte LEFT DELETING LEADING '0 '.", js: `abap.statements.shift(lv_bitbyte, {direction: 'LEFT',deletingLeading: '0 '});`, skip: false},
    {abap: "SHIFT lv_temp BY 1 PLACES LEFT.", js: `abap.statements.shift(lv_temp, {direction: 'LEFT',places: constant_1});`, skip: false},
    {abap: "SHIFT lv_temp UP TO '/' LEFT.", js: `abap.statements.shift(lv_temp, {direction: 'LEFT',to: '/'});`, skip: false},

    {abap: "TRANSLATE rv_spras TO UPPER CASE.", js: `abap.statements.translate(rv_spras, "UPPER");`, skip: false},
    {abap: "TRANSLATE rv_spras TO LOWER CASE.", js: `abap.statements.translate(rv_spras, "LOWER");`, skip: false},
    {abap: "DESCRIBE FIELD <lg_line> LENGTH lv_length IN CHARACTER MODE.", js: `abap.statements.describe({field: fs_lg_line_, length: lv_length, mode: 'CHARACTER'});`, skip: false},
    {abap: "DESCRIBE FIELD <lg_line> LENGTH lv_length IN BYTE MODE.", js: `abap.statements.describe({field: fs_lg_line_, length: lv_length, mode: 'BYTE'});`, skip: false},
    {abap: "DESCRIBE FIELD tab TYPE type.", js: `abap.statements.describe({field: tab, type: type});`, skip: false},
    {abap: "foo = 2 ** 2.",   js: `foo.set(constant_2.power(constant_2));`,                       skip: false},
    {abap: "foo = 5 DIV 2.",  js: `foo.set(constant_5.integerDiv(constant_2));`,                  skip: false},
    {abap: "foo+5(1) = 'A'.", js: `new abap.OffsetLength(foo, {offset: 5, length: 1}).set('A');`, skip: false},
    {abap: "foo(1) = 'a'.",   js: "new abap.OffsetLength(foo, {length: 1}).set('a');",            skip: false},
    {abap: "foo+1 = 'a'.",    js: "new abap.OffsetLength(foo, {offset: 1}).set('a');",            skip: false},
    {abap: "foo+1(1) = 'a'.", js: "new abap.OffsetLength(foo, {offset: 1, length: 1}).set('a');", skip: false},
    {abap: "foo(bar) = 'a'.", js: "new abap.OffsetLength(foo, {length: bar.get()}).set('a');",    skip: false},
    {abap: "IF iv_cd = '' OR iv_cd = '.'.\nENDIF.", js: "if (abap.compare.eq(iv_cd, '') || abap.compare.eq(iv_cd, '.')) {\n}", skip: false},
  ];

  for (const test of tests) {
    if (test.skip) {
      it.skip(test.abap, async () => {
        return;
      });
    } else {
      it(test.abap, async () => {
        UniqueIdentifier.reset();
        const options: ITranspilerOptions = {ignoreSyntaxCheck: true, skipConstants: true};
        expect(await runSingle(test.abap, options)).to.equal(test.js);
      });
    }
  }

});