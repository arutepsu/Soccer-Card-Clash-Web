import sbt._
import Keys._
import play.sbt.PlayImport._

ThisBuild / scalaVersion := "3.3.3"

lazy val sccWeb = (project in file("."))
  .enablePlugins(PlayScala)
  .dependsOn(scc)
  .settings(
    name := "SoccerCardClashWeb",
    libraryDependencies ++= Seq(
      guice // Play's guice module (keep this)
    ),
    // 🔧 Force javax-based Guice across the whole build
    dependencyOverrides ++= Seq(
      "com.google.inject" % "guice" % "6.0.0",
      "com.google.inject.extensions" % "guice-assistedinject" % "6.0.0",
      "net.codingwell" %% "scala-guice" % "6.0.0",
      "javax.inject" % "javax.inject" % "1",
      "com.typesafe.play" %% "filters-helpers" % play.core.PlayVersion.current
    )
  )

lazy val scc = ProjectRef(file("../Soccer-Card-Clash"), "root")


