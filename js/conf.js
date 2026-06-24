class Form {

  #name;
  #inputs;

  constructor(name) {
    this.#name = name;
    this.#inputs = document.forms[name].getElementsByTagName('input');
    this.#initInputs();
    window.addEventListener('pagehide', event => {
      if (!event.persisted) {
        this.#saveConf();
      }
    });
  }

  #initInputs() {
    const conf = localStorage.getItem(this.#name);
    if (conf) {
      for (const [key, value] of Object.entries(JSON.parse(conf))) {
        const input = this.#inputs[key];
        if (input) {
          input[valueKey(input)] = value;
        }
      }
    }
  }

  getConf() {
    const conf = {};
    for (const input of this.#inputs) {
      let value = input[valueKey(input)];
      if (input.type === 'number') {
        value = Number(value);
      }
      conf[input.name] = value;
    }
    return conf;
  }

  #saveConf() {
    localStorage.setItem(this.#name, JSON.stringify(this.getConf()));
  }
}


function valueKey(input) {
  switch (input.type) {
    case 'checkbox':
      return 'checked';
    default:
      return 'value';
  }
}


function getTrimConf() {
  const trimConf = trimForm.getConf();
  for (const [key, value] of Object.entries(trimConf)) {
    if (
        key.startsWith('trim')
        && (typeof value !== 'number' || value < 0 || value > 100)
      ) {
      throw Error(`${key} is invalid value.`);
    }
  }
  return trimConf;
}


const trimForm = new Form('trim');


export { getTrimConf };
