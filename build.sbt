import sbt._
import Keys._
import play.sbt.PlayImport._
import play.sbt.PlayScala

ThisBuild / scalaVersion := "3.3.3"

ThisBuild / resolvers ++= Seq(
  "GitHub Packages" at "https://maven.pkg.github.com/arutepsu/Soccer-Card-Clash"
)

ThisBuild / credentials += Credentials(
  "GitHub Package Registry",
  "maven.pkg.github.com",
  sys.env.getOrElse("GITHUB_USER", ""),
  sys.env.getOrElse("GITHUB_TOKEN", "")
)

lazy val backend = (project in file("backend"))
  .enablePlugins(PlayScala)
  .settings(
    name := "SoccerCardClashWeb-backend",
    libraryDependencies ++= Seq(
      guice,
      "io.github.arutepsu" %% "soccer-card-clash-core" % "0.1.0"
    ),
    dependencyOverrides ++= Seq(
      "com.google.inject" % "guice" % "6.0.0",
      "com.google.inject.extensions" % "guice-assistedinject" % "6.0.0",
      "net.codingwell" %% "scala-guice" % "6.0.0",
      "javax.inject" % "javax.inject" % "1",
      "com.typesafe.play" %% "filters-helpers" % play.core.PlayVersion.current
    )
  )

lazy val root = (project in file("."))
  .aggregate(backend)
  .settings(
    name := "SoccerCardClashWeb",
    publish / skip := true
  )
