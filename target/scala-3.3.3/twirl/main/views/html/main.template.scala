
package views.html

import _root_.play.twirl.api.TwirlFeatureImports.*
import _root_.play.twirl.api.TwirlHelperImports.*
import scala.language.adhocExtensions
import _root_.play.twirl.api.Html
import _root_.play.twirl.api.JavaScript
import _root_.play.twirl.api.Txt
import _root_.play.twirl.api.Xml
import models._
import controllers._
import play.api.i18n._
import views.html._
import play.api.templates.PlayMagic._
import play.api.mvc._
import play.api.data._

object main extends _root_.play.twirl.api.BaseScalaTemplate[play.twirl.api.HtmlFormat.Appendable,_root_.play.twirl.api.Format[play.twirl.api.HtmlFormat.Appendable]](play.twirl.api.HtmlFormat) with _root_.play.twirl.api.Template2[String,Html,play.twirl.api.HtmlFormat.Appendable] {

  /**/
  def apply/*1.2*/(title: String)(content: Html):play.twirl.api.HtmlFormat.Appendable = {
    _display_ {
      {


Seq[Any](format.raw/*1.32*/("""
"""),format.raw/*2.1*/("""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <title>"""),_display_(/*6.13*/title),format.raw/*6.18*/("""</title>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <style>
      body """),format.raw/*9.12*/("""{"""),format.raw/*9.13*/(""" """),format.raw/*9.14*/("""font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; margin: 24px; """),format.raw/*9.99*/("""}"""),format.raw/*9.100*/("""
      """),format.raw/*10.7*/("""pre """),format.raw/*10.11*/("""{"""),format.raw/*10.12*/(""" """),format.raw/*10.13*/("""white-space: pre-wrap; border: 1px solid #ddd; padding: 1rem; min-height: 240px; """),format.raw/*10.94*/("""}"""),format.raw/*10.95*/("""
      """),format.raw/*11.7*/(""".row """),format.raw/*11.12*/("""{"""),format.raw/*11.13*/(""" """),format.raw/*11.14*/("""display: flex; gap: 8px; margin-top: 8px; """),format.raw/*11.56*/("""}"""),format.raw/*11.57*/("""
      """),format.raw/*12.7*/("""input """),format.raw/*12.13*/("""{"""),format.raw/*12.14*/(""" """),format.raw/*12.15*/("""flex: 1; """),format.raw/*12.24*/("""}"""),format.raw/*12.25*/("""
      """),format.raw/*13.7*/("""button """),format.raw/*13.14*/("""{"""),format.raw/*13.15*/(""" """),format.raw/*13.16*/("""padding: 6px 12px; """),format.raw/*13.35*/("""}"""),format.raw/*13.36*/("""
    """),format.raw/*14.5*/("""</style>
  </head>
  <body>"""),_display_(/*16.10*/content),format.raw/*16.17*/("""</body>
</html>
"""))
      }
    }
  }

  def render(title:String,content:Html): play.twirl.api.HtmlFormat.Appendable = apply(title)(content)

  def f:((String) => (Html) => play.twirl.api.HtmlFormat.Appendable) = (title) => (content) => apply(title)(content)

  def ref: this.type = this

}


              /*
                  -- GENERATED --
                  SOURCE: app/views/main.scala.html
                  HASH: fa24a506752e52295198e1d236a33f2da9bcc3f5
                  MATRIX: 771->1|896->31|924->33|1036->119|1061->124|1197->233|1225->234|1253->235|1365->320|1394->321|1429->329|1461->333|1490->334|1519->335|1628->416|1657->417|1692->425|1725->430|1754->431|1783->432|1853->474|1882->475|1917->483|1951->489|1980->490|2009->491|2046->500|2075->501|2110->509|2145->516|2174->517|2203->518|2250->537|2279->538|2312->544|2369->574|2397->581
                  LINES: 22->1|27->1|28->2|32->6|32->6|35->9|35->9|35->9|35->9|35->9|36->10|36->10|36->10|36->10|36->10|36->10|37->11|37->11|37->11|37->11|37->11|37->11|38->12|38->12|38->12|38->12|38->12|38->12|39->13|39->13|39->13|39->13|39->13|39->13|40->14|42->16|42->16
                  -- GENERATED --
              */
          