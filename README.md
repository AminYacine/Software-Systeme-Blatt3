## Inhaltsverzeichnis

  1. [Über das Projekt](#über-das-projekt)
  2. [Getting Started](#getting-started)
     - [Voraussetzungen](#voraussetzungen)
     - [Installation](#installation-der-dependencies)
     - [Start](#start)
  3. [Nutzung](#nutzung)
     - [Übersichtsseite](#startseite)
     - [Zeichenansicht](#zeichenansicht)
     - [Notiz](#notiz)
  4. [Acknowledgments](#acknowledgments)


<!-- ABOUT THE PROJECT -->
## Über das Projekt
Dieses Projekt wurde im Rahmen des Kurses „Softwaresysteme“ entwickelt. 
Es ermöglicht mehreren Nutzern, in gemeinsam genutzten Zeichenräumen Formen zu erstellen, zu zeichnen und zu verändern. 
Nutzer können neue Räume erstellen oder bestehenden Räumen beitreten, um in Echtzeit zusammenzuarbeiten.

Das Backend basiert auf Node.js und dem Express-Framework, während das Frontend als Single Page Applikation realisiert wurde. 
Die Anwendung nutzt WebSockets für die Echtzeitkommunikation zwischen den Nutzern.

Verwendete Pakete:
* ws
* uuid


<!-- GETTING STARTED -->
## Getting Started
Um die Applikation lokal zu installieren und zu starten müssen folgende Schritte befolgt werden.

### Voraussetzungen

NPM muss installiert sein
  ```sh
  npm install npm@latest -g
  ```

### Installation der Dependencies
 
NPM Pakete installieren
   ```sh
   npm install
   ```

### Start
Backend starten aus dem root Verzeichnis

```sh
node backend.js
   ```

<!-- USAGE EXAMPLES -->
## Nutzung

Nachdem die Anwendung gestartet wurde, kann im Browser unter [http://localhost:8080/](http://localhost:8080/) die Startseite aufgerufen werden. 
Diese stellt die Hauptseite der Applikation dar. Die Pfeiltasten können NICHT zur Navigation verwendet werden.

### Startseite
Auf der linken Seite befindet sich die Navigation zum Hauptmenü, welche auf jeder Seite angezeigt wird. 

Zudem kann im 
anliegenden Eingabefeld ein neuer Raumname eingegeben werden und mit dem Button `Create new Room` ein neuer Raum erstellt werden. Wird dieser gedrückt wird dem
Nutzer die Canvas Ansicht angezeigt.

Unter dem Eingabefeld ist eine Liste mit offenen Räumen zu sehen. Dabei werden auch erstellte Räume von anderen Nutzern angezeigt.
Der erste Teil stellt den Namen des Raumes dar, wobei in Klammer zusätzlich die Id des Raumes angegeben wird. 
Durch das Drücken eines Listeneintrags kann der Nutzer diesem Raum beitreten.

### Zeichenansicht
In der Zeichenansicht kann der Nutzer verschiedene Formen auswählen und auf dem Canvas zeichnen. 
Sobald eine Form ausgewählt ist, kann diese durch Ziehen auf dem Canvas erstellt werden. 
Wenn das Auswahlwerkzeug aktiviert ist, können bereits gezeichnete Formen ausgewählt, verändert oder gelöscht werden.

Selektierte Formen von anderen Nutzern werden mit roten Kästen markiert und sind für andere Nutzer blockiert, während die eigenen Formen blau hervorgehoben werden. 
Während einer Session kann jederzeit die Seite neu geladen werden. 
Verlässt ein Nutzer einen Raum und hat noch Formen selektiert, werden diese im Anschluss automatisch wieder freigegeben.

### Notiz
Die Shape Ids werden aus einer Zusammensetzung von Userid und einer Zahl, die hochgezählt wird, generiert.
Zur Erstellung der Raum Ids wird das Paket uuid verwendet.

Sobald ein Nutzer die Website aufruft, wird eine Session erstellt. Diese läuft erst ab, wenn der Nutzer den Tab mit der Anwendung schließt. 
Die Session Daten werden im Session Storage gespeichert.

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template/blob/master/README.md)
* [Build a Single Page Application with JavaScript (No Frameworks)](https://www.youtube.com/watch?v=6BozpmSjk-Y&ab_channel=dcode)