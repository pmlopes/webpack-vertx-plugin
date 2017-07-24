import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import {Component, NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";

@Component({
    selector: "hellow-app",
    template: "<h1>Hello Friend</h1>"
})
class HelloComponent {
}

@NgModule({
    imports:      [BrowserModule ], // import Angular's BrowserModule
    bootstrap:    [HelloComponent],  // indicate the bootstrap component
    declarations: [HelloComponent] // register our component with the module
})
export class AppModule {}

platformBrowserDynamic().bootstrapModule(AppModule); // bootstrap with our module
