class ConfForm {

  #name;
  #inputs;

  constructor(name) {
    this.#name = name;
    this.#inputs = document.forms[name].getElementsByTagName('input');
    this.#loadUserConf();
    window.addEventListener('pagehide', event => {
      if (!event.persisted) {
        this.#saveUserConf();
      }
    });
  }

  getConf() {
    const conf = {};
    for (const input of this.#inputs) {
      let value = input[toValueKey(input)];
      if (input.type === 'number') {
        value = Number(value);
      }
      conf[input.name] = value;
    }
    return conf;
  }

  #loadUserConf() {
    const conf = localStorage.getItem(this.#name);
    if (conf) {
      for (const [key, value] of Object.entries(JSON.parse(conf))) {
        const input = this.#inputs[key];
        if (input) {
          input[toValueKey(input)] = value;
        }
      }
    }
  }

  #saveUserConf() {
    try {
      localStorage.setItem(this.#name, JSON.stringify(this.getConf()));
    }
    catch (err) {
      console.error(err);
    }
  }
}


class TrimForm extends ConfForm {

  constructor() {
    super('trim');
  }

  getConf() {
    const conf = super.getConf();
    for (const [key, value] of Object.entries(conf)) {
      if (
          key.startsWith('trim')
          && (typeof value !== 'number' || value < 0 || value > 100)
        ) {
        throw Error(`${key} is invalid value.`);
      }
    }
    return conf;
  }
}


function toValueKey(input) {
  switch (input.type) {
    case 'checkbox':
      return 'checked';
    default:
      return 'value';
  }
}


const trimForm = new TrimForm();


export { trimForm };
