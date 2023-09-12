
const wpwLoader = require("./types");

function loaderAsync(source, map, meta)
{
    const callback = this.async();
	wpwLoader.call(this, source, map, meta)
    .then(
        (args) => callback(null, ...args),
        (err) => callback(err)
    );
}

function loader (source, map, meta)
{
    this.cacheable();
    this.callback(null, wpwLoader.call(this, source, map, meta), map);
}


module.exports = loaderAsync;
module.exports.sync = loader;
module.exports.async = loaderAsync;
