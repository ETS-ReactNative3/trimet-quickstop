import React from 'react';
import Cache from '../cache';
import Routes from '../routes';
import Server from '../server';
import NavBar from './NavBar';
import StopPane from './StopPane';
import MapPane from './MapPane';
import SearchPane from './SearchPane';
import MenuPane from './MenuPane';
import styles from './Container.css';

const DATA_UPDATE_INTERVAL = 1000;
const DATA_REQUEST_INTERVAL = 30000;

class Container extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isMapOpen: false,
      isSearchOpen: false,
      isMenuOpen: false,
      isPm: false,
      amStop: undefined,
      pmStop: undefined,
      lastUpdated: 0,
      stop: { name: '', direction: '' },
      arrivals: []
    };
    this.handleAmClick = this.handleAmClick.bind(this);
    this.handlePmClick = this.handlePmClick.bind(this);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.handleSearchClose = this.handleSearchClose.bind(this);
    this.handleSearchSet = this.handleSearchSet.bind(this);
    this.arrivalsInterval;
    this.cache = new Cache(DATA_REQUEST_INTERVAL);
    this.routes = new Routes();
    this.allStops = this.routes.allStops();

    window.onload = (() => { 
      this.setPm(this.checkPm()); 
      this.initializeArrivals();
    });
  }

  checkPm() {
    return ((new Date()).getHours() >= 12);
  }

  setTimeOfDayColors(isPm) {
    const accentName = (isPm ? '--accent-pm-color' : '--accent-am-color');
    const textName = (isPm ? '--light-text-pm-color' : '--light-text-am-color');
    const accentValue = getComputedStyle(document.documentElement).getPropertyValue(accentName);
    const textValue = getComputedStyle(document.documentElement).getPropertyValue(textName);
    document.documentElement.style.setProperty('--accent-color', accentValue);
    document.documentElement.style.setProperty('--light-text-color', textValue);
  }

  setPm(isPm) {
    this.setTimeOfDayColors(isPm);
    this.setState({isPm: isPm});
  }

  handleAmClick() {
    this.setPm(false);
  }

  handlePmClick() {
    this.setPm(true);
  }

  handleChangeClick() {
    this.setState({isSearchOpen: true});
  }

  handleSearchClose() {
    this.setState({isSearchOpen: false});
  }

  handleSearchSet(id) {
    let data = {arrivals: [], lastUpdated: Date.now()};
    if(this.state.isPm) {
      data.pmStop = id;
    } else {
      data.amStop = id;
    }
    this.updateData(data);
    this.setState(data);
    this.updateArrivals();
  }

  componentDidMount() {
    this.setState(this.loadData());
  }

  loadData() {
    const stored = window.localStorage && window.localStorage.getItem('quickStopData');
    return JSON.parse(stored) || {};
  }

  updateData(data) {
    if(window.localStorage) {
      const updated = Object.assign(this.loadData(), data);
      window.localStorage.setItem('quickStopData', JSON.stringify(updated));
    }
  }

  randomStop() {
    //??? set random stop, change if time > 60000
    //this.allStops
    //return Math.floor(10000 * Math.random());
    return 8334;
  }

  currentStop(state) {
    const stop = (state.isPm ? state.pmStop : state.amStop);
    return (typeof(stop) !== 'undefined' ? stop : this.randomStop());
  }

  initializeArrivals() {
    this.updateArrivals();
    this.arrivalsInterval = setInterval(this.updateArrivals.bind(this), DATA_UPDATE_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if(document.hidden) {
        clearInterval(this.arrivalsInterval);
      } else {
        this.arrivalsInterval = setInterval(this.updateArrivals.bind(this), DATA_UPDATE_INTERVAL);
      }
    });
  }

  updateArrivals() {
    Server.getArrivals(this.currentStop(this.state), this.cache)
      .then(({ stop, arrivals }) => {
        this.setState({
          stop: stop,
          arrivals: arrivals
        });
      });
  }

  render() {
    return (
      <div className={styles.container}>
        <NavBar
          isPm={this.state.isPm}
          onAmClick={this.handleAmClick}
          onPmClick={this.handlePmClick}/>
        <StopPane
          stopName={this.state.stop.name}
          stopDirection={this.state.stop.direction}
          stopId={this.currentStop(this.state)}
          arrivals={this.state.arrivals}
          onChangeClick={this.handleChangeClick}/>
        {this.state.isMapOpen && <MapPane/>}
        <SearchPane
          isOpen={this.state.isSearchOpen}
          onClose={this.handleSearchClose}
          onSet={this.handleSearchSet}/>
        {this.state.isMenuOpen && <MenuPane/>}
      </div>
    );
  }
}

export default Container;
