package filters

import javax.inject._
import play.api.http.DefaultHttpFilters
import play.filters.csrf.CSRFFilter
import play.filters.headers.SecurityHeadersFilter
import play.filters.hosts.AllowedHostsFilter

@Singleton
class Filters @Inject()(
  access: AccessLog,
  csrf: CSRFFilter,
  security: SecurityHeadersFilter,
  hosts: AllowedHostsFilter
) extends DefaultHttpFilters(access, csrf, security, hosts)
