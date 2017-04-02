        var isSingular = false;
        var currentLanguage = "en";

        function isSmallScreen() {
            if ((screen.width < 480) || (screen.height < 480)) {
                return true;
            }
            return false;
        }

        function redirection() {
            var loc = window.location.href;
            var path = "entry/" + loc.split("entry/")[1];
            var newLoc = false;
            if (isSingular) {
                newLoc = rootUrl + "#/" + path;
            }
            if (newLoc && !isSmallScreen()) {
                window.location.href = newLoc;
            }
        }
        redirection();