<?php

namespace SynchWeb\Authentication\Type;

use SynchWeb\Authentication\AuthenticationInterface;
use SynchWeb\Authentication\AuthenticationParent;

class LDAP extends AuthenticationParent implements AuthenticationInterface
{
    function authorise()
    {
        return false;
    }

    function authenticateByCode($code)
    {
        return false;
    }

    function check()
    {
        return false;
    }

    function authenticate($login, $password)
    {
        global $ldap_server, $ldap_search, $ldap_use_tls;

        $conn = ldap_connect($ldap_server);

        if ($conn) {
            // Tested against LDAP version 3 (could add support for older versions here)
            ldap_set_option($conn, LDAP_OPT_PROTOCOL_VERSION, 3);

            // use a secure connection for LDAP, if configured this way (default is unsecured as this was the historical setting)
            if ($ldap_use_tls) {
                ldap_start_tls($conn);
            }

            try {
                // testing with openldap indicates this call needs to use a correct
                // DN syntax: "uid=<login>,ou=people,dc=example,dc=com"
                return ldap_bind($conn, "uid=" . $login . "," . $ldap_search, $password);

                // Couldn't bind
            } catch (\Exception $e) {
                return false;
            }
        }
    }
}
