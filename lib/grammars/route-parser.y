/* description: Parses and executes mathematical expressions. */

/* lexical grammar */
%lex
%%

[ ]                  return "WHITE_SPACE"
["]                  return 'DOUBLE_QUOTE'
[']                   return 'SINGLE_QUOTE'
"ranges"               return "ranges"
"keys"                return "keys"
"integers"            return "integers"
"["                   return "["
"]"                   return "]"
"{"                   return "{"
"}"                   return "}"
":"                   return ':'
"."                   return "."
","                   return ","
(.)                   return 'Unknown_Char'
<<EOF>>               return 'EOF'

/lex

/* operator associations and precedence */

%start root

%% /* language grammar */

root
    : route EOF {
      $$ = $1;
      return $$;
    }
    ;

route
    : idSegment {
      $$ = [$1]
    }
    | "[" nonIdSegment "]" {
      $$ = [$2]
    }
    | route "." idSegment {
      $1.push($3)
      $$ = $1
    }
    | route "[" nonIdSegment "]" {
      $1.push($3)
      $$ = $1
    }
    | route "." "[" nonIdSegment "]" {
      $1.push($4)
      $$ = $1
    }
    ;

idString
    : Unknown_Char -> $1
    | ranges -> $1
    | integers -> $1
    | keys -> $1
    | "," -> $1
    | idString Unknown_Char -> $1 + $2
    | idString ranges -> $1 + $2
    | idString integers -> $1 + $2
    | idString keys -> $1 + $2
    | idString "," -> $1 + $2
    ;

idSegment
    : idString {
      $$ = {
        type:"id",
        value: $1
      };
    }
    ;

nonIdSegment
    : "{" "ranges" ":" idString "}" {
      $$ = {
        "type": "variable",
        "varType" : "ranges",
        "variable" : $4
      }
    }
    | "{" "integers" ":" idString "}" {
      $$ = {
        "type": "variable",
        "varType" : "integers",
        "variable" : $4
      }
    }
    | "{" "keys" ":" idString "}" {
      $$ = {
        "type": "variable",
        "varType" : "keys",
        "variable" : $4
      }
    }
    | enumeratedSegment {
      $$ = {
        type:"enum",
        enums: $1
      }
    }
    ;

optionalWhiteSpace
    : /**/ {}
    | WHITE_SPACE {}
    ;

enumeratedSegment
    :  DOUBLE_QUOTE idString DOUBLE_QUOTE optionalWhiteSpace {
      $$ = [$2];
    }
    |  SINGLE_QUOTE idString SINGLE_QUOTE optionalWhiteSpace {
      $$ = [$2];
    }
    |  enumeratedSegment "," optionalWhiteSpace SINGLE_QUOTE idString SINGLE_QUOTE optionalWhiteSpace {
      $1.push($5);
      $$ = $1
    }
    |  enumeratedSegment "," optionalWhiteSpace DOUBLE_QUOTE idString DOUBLE_QUOTE optionalWhiteSpace {
      $1.push($5);
      $$ = $1
    }
    ;
