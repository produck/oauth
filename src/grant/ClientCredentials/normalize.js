const Ajv = require('ajv');
const ajv = new Ajv;
require('ajv-keywords')(ajv, ['instanceof']);
const schema = require('./schema.json');

module.exports = function ClientCredentialsNormalize(options = {}) {
	const validate = ajv.compile(schema);
	const valid = validate(options); 

	if (!valid) {
		validate.errors.forEach(error => {
			console.log(error);
		});

		throw new Error(JSON.stringify(validate.errors));
	}
	
	const finalOptions = defaultClientCredentialsFactory();

	if (options) {
		const {
			scope: _scope = finalOptions.scope,
			saveToken: _saveToken = finalOptions.saveToken
		} = options;

		finalOptions.saveToken = _saveToken;
		
		if (typeof _scope === 'object') {
			const {
				accept: _accpet = finalOptions.scope.accept,
				validate: _validate = finalOptions.scope.validate,
				valueValidate: _valueValidate = finalOptions.scope.valueValidate
			} = _scope;

			finalOptions.scope.accept = _accpet;
			finalOptions.scope.validate = _validate;
			finalOptions.scope.valueValidate = _valueValidate;
		}
	}

	return finalOptions;
};

function defaultClientCredentialsFactory() {
	const store = {};

	return {
		scope: {
			accept: ['*'],
			validate(accept, scope, valueValidate) {
				const scopes = scope.split(/\s+/);
				
				if (accept.length < scopes.length) {
					return false;
				}

				for (const value of scopes.values()) {
					if (accept.indexOf(value) < 0) {
						return false;
					}
				}

				return valueValidate(scopes);
			},
			valueValidate(scopes) {
				return true;
			}
		},
		saveToken(token, client) {
			const accessToken = Object.assign(token.accessToken, {
				client,
				scope: token.scope
			});

			store[accessToken.id] = accessToken;

			return true;
		}
	};
}