import sbt._
import Keys._
import play.sbt.PlayImport._
import play.sbt.PlayScala

ThisBuild / scalaVersion := "3.3.3"

lazy val scc = ProjectRef(file("../SoccerCardClash"), "root")

lazy val backend = (project in file("backend"))
  .enablePlugins(PlayScala)
  .dependsOn(scc)
  .settings(
    name := "SoccerCardClashWeb-backend",
    libraryDependencies ++= Seq(
      guice
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
