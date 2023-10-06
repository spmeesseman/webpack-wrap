
const WpwOptions =
{
    help: [
        true,
        "boolean",
        false,
        [ "-h", "--help" ],
        {
            help: "Display console help.",
            helpPrivate: false
        }
    ],

    version: [
        true,
        "boolean",
        false,
        [ "-v", "--version" ],
        {
            help: "Display the current wpwrap version.",
            helpPrivate: false
        }
    ]
};


module.exports = WpwOptions;
