
<!-- TABLE OF CONTENTS -->
<details>
  <summary>Inhaltsverzeichnis</summary>
  <ol>
    <li>
      <a href="#about-the-project">Über das Projekt</a>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Voraussetzungen</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Nutzung</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## Über das Projekt
Dieses Projekt ist die Implementierung des dritten Aufgabenblattes des Moduls Softwaresysteme 
und enthält alle drei Unteraufgaben.

Das Backend wurde mit dem Paketmanager Node und dem Framework Express aufgesetzt. 
Das Frontend wurde als Single Page Applikation implementiert. 

Verwendete Pakete:
* ws 
* uuid


<!-- GETTING STARTED -->
## Getting Started
Um die Applikation lokal zu installieren und zu starten müssen folgende Schritte befolgt werden.

### Voraussetzungen

* npm muss installiert sein
  ```sh
  npm install npm@latest -g
  ```

### Installation
 
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

Nachdem die Anwendung gestartet wurde, kann im Browser unter ``http://localhost:8080/`` die Übersichtsseite aufgerufen werden. 
Diese stellt die Hauptseite der Applikation dar. Die Pfeiltasten können NICHT zur Navigation verwendet werden.

###Übersichtsseite
Auf der linken Seite befindet sich die Navigation zum Hauptmenü, welche auf jeder Seite angezeigt wird. 

Zudem kann im 
anliegenden Eingabefeld ein neuer Raumname eingegeben werden und mit dem Button `Create new Room` ein neuer Raum erstellt werden. Wird dieser gedrückt wird dem
Nutzer die Canvas Ansicht angezeigt.

Unter dem Eingabefeld ist eine Liste mit offenen Räumen zu sehen. Dabei werden auch erstellte Räume von anderen Nutzern angezeigt.
Der erste Teil stellt den Namen des Raumes dar, wobei in Klammer zusätzlich die Id des Raumes angegeben wird. 
Durch das Drücken eines Listeneintrags kann der Nutzer diesem Raum beitreten.

###Zeichenansicht
Auch hier kann über die Navigation auf der linken Seite zur Übersichtseite zurückgekehrt werden. 
Es können zusätzlich zu Blatt2, Formen ausgewählt und anschließend bewegt werden. Dies ist nur möglich, wenn exakt eine Form ausgewählt wurde.

Selektierte Formen von anderen Nutzern werden mit roten Kästen markiert und sind für andere Nutzer blockiert, wobei die eigenen blau markiert werden. 
Während einer Session kann jederzeit die Seite neu geladen werden.
Verlässt ein User einen Raum und hat noch Formen selektiert, werden diese im Anschluss automatisch wieder freigegeben.


<!-- ACKNOWLEDGMENTS -->
## Acknowledgments
* [Best-README-Template](https://github.com/othneildrew/Best-README-Template/blob/master/README.md)
* [Build a Single Page Application with JavaScript (No Frameworks)](https://www.youtube.com/watch?v=6BozpmSjk-Y&ab_channel=dcode)