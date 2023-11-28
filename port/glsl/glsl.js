import * as o from "../operator-objects.js"
import template from "./template.js"
import * as lib from "./operators.js"

export { create_shader }


const version = '0.1'
const generate_comments = false;
const indentation = " ".repeat(5);


function format_floats(values) {
   var floats = [];
   
   for (const num of values) {
      floats.push(Number.parseFloat(num).toFixed(8));
   }
   
   return floats;
}

function indent(block) {
   return indentation + block.split('\n').join("\n" + indentation);
}

function string_of_value(type, value) {
   switch (type) {
      case "bool":  return value.toString();
      case "float": return Number.parseFloat(value).toFixed(8);
      case "vec2": {
         if(value[0] === value[1])
            return "vec2(" + value[0] + ")";
         
         var floats = format_floats(value);
         return "vec2(" + floats + ")";
         }
      case "vec3": {
         if(value[0] === value[1] && value[1] == value[2])
            return "vec3(" + value[0] + ")";
         
         var floats = format_floats(value);
         return "vec3(" + floats + ")";
         }
      default: throw new Error("glsl.string_of_value: unrecognized type " + type);
   }
}

function make_variable_name(choice) {
   return choice.operator.toUpperCase() + choice.instanceId + "_" + choice.name.toUpperCase();
}

function register_choice(choice, glsl_data) {
   const variable_name = make_variable_name(choice);
   
   // switch(choice.type)
   // se è un array:
   // - aggiungi dichiarazione
   // - aggiungi inizializzazione
   // e poi return
   
   // altrimenti, caso default:
   // aggiungi alle dichiarazioni
   // choice.type + " " + name + " = " + string_of_value(choice.value); 

   if (choice.isArray) {
      const type_of_elements = choice.type.split(" ")[0];
      glsl_data.declarations.push(`${type_of_elements} ${variable_name}[${choice.value.length}];`);
      glsl_data.declarations.push(`#define ${variable_name}_LENGTH ${choice.value.length}`);
      var array_init = "";
      for (var i = 0; i < choice.value.length; i++) {
         array_init += `${variable_name}[${i}] = ${string_of_value(type_of_elements, choice.value[i])};\n`;
      }
      glsl_data.array_init.push(array_init);
   }
   else {
      glsl_data.declarations.push(`const ${choice.type} ${variable_name} = ${string_of_value(choice.type, choice.value)};`);
   }
}

function make_data(random_choices) {
   var glsl_data = { declarations: [],
                     array_init: [] };

   for (const operator_instances of Object.values(random_choices)) {
      for (const instance of operator_instances) {
         for (const choice of instance) {
            register_choice(choice, glsl_data);
         }
      }
   }
   
   return glsl_data;
}

function make_arguments(argv, choices, instanceId) {
   var args = [];
   
   for (const i in argv) {
      args.push(`e${argv[i]}`);
   }
   
   if(choices) {
      for (const choice of choices[instanceId]) {
         args.push(make_variable_name(choice));
      }
   }
   
   return args;
}

function make_command(geneLink, instanceId) {
   var command = "";
   switch (geneLink.operator) {
      case "pt": // fall-through
      case "t":
         command += `${geneLink.retval} e${geneLink.index} = LEAF_NODE_${geneLink.operator.toUpperCase()};`;
         break;
      case "pclosestmax": // fall-through
      case "fclosest":    // fall-through
      case "pfoci": {
         let choice_name = geneLink.choices[0].slice(-1)[0].name.toUpperCase();
         let length_name = `${geneLink.operator.toUpperCase()}${instanceId}_${choice_name}_LENGTH`;
         let standard_args = make_arguments(geneLink.argv, geneLink.choices, instanceId)
         command += `${geneLink.retval} e${geneLink.index};\n`;
         command += `${geneLink.operator}(e${geneLink.index},${standard_args},${length_name});`;
         break;
      }
      default: {
         command += `${geneLink.retval} e${geneLink.index} = ${geneLink.operator}`;
         command += `(${make_arguments(geneLink.argv, geneLink.choices, instanceId)});`;
         break;
      }
   }
   
   return command;
}

// returns a GeneLink object which fully describes the transformation applied by a single line of genome
function parse_line(line, choices) {
   let [index, operator, argv] = line.split(' ');
   index = index.split(':')[0];
   argv = argv.slice(1,-1).split(',');
   
   return {
      index: index,
      operator: operator,
      argv: argv,
      retval: o[operator].retval,
      choices: choices[operator]
   };
}

function make_text(gene_listing, choices) {
   const listing = gene_listing.split('\n').reverse();
   
   // per ogni riga del listato,
   // i: operator (arg_1, ..., arg_n)
   // deve diventare:
   // retval_type e$(i) = operator(e$(arg_1), ..., e$(arg_n));
   
   var commands = [];
   var instanceIdTable = {};
   for (const line of listing) {
      if (line.length === 0)
         break;
      
      if(generate_comments === true) {
         let comment = `// ${line}`;
         commands.push(comment);
      }
      
      let geneLink = parse_line(line, choices);
      
      if (instanceIdTable[geneLink.operator] === undefined) {
         instanceIdTable[geneLink.operator] = 0;
      }
      else {
         instanceIdTable[geneLink.operator] += 1; 
      }
      
      let new_command = make_command(geneLink, instanceIdTable[geneLink.operator]);
      commands.push(new_command);
   }
   
   return commands.join('\n');
}

function get_library(gene_listing) {
   var operators = []
   
   // crea la lista di operatori che compaiono
   for (const line of gene_listing.split('\n')) {
      let op = line.split(' ')[1];
      operators.push(op);
   }
   
   // elimina i duplicati
   operators = new Set(operators);

   // recupera la definizione di ciascun op nella lista
   var library = "";
   for (const op of operators) {
      library += `${lib[op]}\n`
   }
   return library;
}

function get_timestamp() {
   const now = new Date(Date.now());
   const options = { year: 'numeric', month: 'short', day: 'numeric',
                     hour: 'numeric', minute: 'numeric'};
   
   return now.toLocaleDateString('en-UK', options) + " GMT";
}

function make_about(params) {
   const timestamp = get_timestamp();
   var about = `Generated automatically on ${timestamp}\n`;
   about += `random-art rewrite ver${version} by Simone Bertolucci\n`;
   about += `size:${params.size}, seed:"${params.seed}"\n`;
   
   return indent(about);
}

function assemble(about, listing, data, library, text) {
   data.declarations = data.declarations.join('\n');
   data.array_init = indent(data.array_init.join('\n'));
   
   return template(about, indent(listing), library, data, indent(text));
}

function create_shader(picture) {
   const data = make_data(picture.choices);
   // trasforma il gene listing in una serie di comandi glsl
   const text = make_text(picture.gene_listing, picture.choices);
   // prende una lista di nomi di operatori e recupera il codice corrispondente
   const library = get_library(picture.gene_listing);
   
   const about = make_about(picture.params);
   
   // assembla il tutto in un'unica stringa pronta per essere stampata su file
   const source = assemble(about, picture.gene_listing, data, library, text);
   
   return source;
}