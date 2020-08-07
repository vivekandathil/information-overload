import * as React from 'react';
import { View, Text, Button, ScrollView, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { Accelerometer, Barometer, Magnetometer, DeviceMotion } from 'expo-sensors';
import moment from "moment";
import SelectInput from 'react-native-select-input-ios'
import MapView from 'react-native-maps';


// temperature, barometer
// save coordinates and save to cloud
// set decimal places
// proximity sensor to navigate screen

import InfoBox from './components/InfoBox.js';

const temp = { "coords": { "altitude": 0, "altitudeAccuracy": 0, "latitude": 0, "accuracy": 0, "longitude": 0, "heading": 0, "speed": 0 }, "timestamp": 0 };
const locationInformation = ["altitude", "altitudeAccuracy", "latitude", "accuracy", "longitude", "heading", "speed"]

const colorOptions = [{ value: 'orange', label: 'Orange' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }];
let color = 'orange';

Accelerometer.setUpdateInterval(100);
Magnetometer.setUpdateInterval(1000);
Barometer.setUpdateInterval(1000);
DeviceMotion.setUpdateInterval(1000);

function HomeScreen({ navigation }) {
  const [location, setLocation] = React.useState(temp);
  const [heading, setHeading] = React.useState({
    "accuracy": 0,
    "magHeading": 0,
    "trueHeading": 0,
  });
  const [acceleration, setAcceleration] = React.useState({ x: 0, y: 0, z: 0 });
  const [pressure, setPressure] = React.useState({ pressure: 0, relativeAltitude: 0.00000 });
  const [magneticField, setMagneticField] = React.useState({ x: 0, y: 0, z: 0 });
  const [errorMsg, setErrorMsg] = React.useState(null);
  const [tracking, setTracking] = React.useState(false);

  let isRendered = React.useRef(false);

  // Ask user for permission to access location and constantly update
  React.useEffect(() => {
    isRendered = true;
    (async () => {

      let { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
      }
      if (isRendered) {
        Accelerometer.addListener(accelerometerData => {
          setAcceleration(accelerometerData);
        });
        Barometer.addListener(barometerData => {
          setPressure(barometerData);
        });
        Magnetometer.addListener(data => {
          setMagneticField(data);
        });
        setLocation(await Location.getCurrentPositionAsync({}));
        setHeading(await Location.getHeadingAsync({}));
        setLocation(location);
      }

    })();
    return () => {
      isRendered = false;
    };
  });

  let text = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
    console.log('error');
  } else if (location) {
    text = JSON.stringify(location);
  }

  return (
    <ScrollView contentContainerStyle={{ flex: 1, alignItems: 'center' }}>
      <View style={{ display: 'flex', width: '90%', marginTop: 10, flexDirection: 'row', justifyContent: 'space-evenly', borderBottomColor: 'black', borderBottomWidth: 1 }}>
        <InfoBox information={moment()
          .format('YYYY-MM-DD hh:mm:ss a')} name={"Date/Time"} width={200} />
      </View>
      <View style={{ display: 'flex', width: '90%', marginTop: 4, flexDirection: 'row', justifyContent: 'space-evenly', borderBottomColor: 'black', borderBottomWidth: 1 }}>
        <InfoBox information={JSON.stringify(location.coords.altitude).slice(0, 5)} name={"Altitude"} units={"m"} />
        <InfoBox information={JSON.stringify(location.coords.longitude).slice(0, 5)} name={"Longitude"} />
        <InfoBox information={JSON.stringify(location.coords.latitude).slice(0, 5)} name={"Latitude"} />
      </View>
      <View style={{ display: 'flex', width: '90%', marginTop: 10, flexDirection: 'row', justifyContent: 'space-evenly', borderBottomColor: 'black', borderBottomWidth: 1 }}>
        <InfoBox information={JSON.stringify(heading.magHeading).slice(0, 5)} name={"Magn. Heading"} units={"°"} width={95} height={100} />
        <InfoBox information={JSON.stringify(heading.trueHeading).slice(0, 5)} name={"True Heading"} units={"°"} width={95} height={100} />
        <InfoBox information={`x: ${JSON.stringify(magneticField.x).slice(0, 5)}\ny: ${JSON.stringify(magneticField.y).slice(0, 5)}\nz: ${JSON.stringify(magneticField.z).slice(0, 5)}`} name={"Magnetic Field"} units={""} height={100} width={150} />
      </View>
      <View style={{ display: 'flex', width: '90%', marginTop: 10, flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <InfoBox information={`x: ${JSON.stringify(acceleration.x).slice(0, 5)} G's\ny: ${JSON.stringify(acceleration.y).slice(0, 5)} G's\nz: ${JSON.stringify(acceleration.z).slice(0, 5)}`} name={"Acceleration"} units={"G's"} height={100} width={140} />
        <Button
          onPress={() => navigation.navigate('MyModal')}
          title="Settings"
        />
      </View>
      <View
        style={{
          backgroundColor: '#fff',
          marginTop: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >

        <MapView
          mapType={'hybrid'}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.001,
            longitudeDelta: 0.001,
          }}
          style={{
            borderRadius: 8,
            width: Dimensions.get('window').width * 0.9,
            height: 200
          }} />
      </View>
    </ScrollView >
  );
}

function ModalScreen({ navigation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: 'HelveticaNeue', fontSize: 30 }}>Settings</Text>
      <View style={{ flexDirection: 'row' }}>
        <Text>Select Colour: </Text>
        <SelectInput value={color} options={colorOptions} style={{ borderWidth: 1, width: 100, height: 20, borderColor: color }} onValueChange={(value) => {
          color = value;
          console.log(value);
        }} />
      </View>
      <Button onPress={() => navigation.goBack()} title="Dismiss" />
    </View>
  );
}

function DetailsScreen() {
  return (
    <View>
      <Text>Details</Text>
    </View>
  );
}

const MainStack = createStackNavigator();
const RootStack = createStackNavigator();

function MainStackScreen() {
  return (
    <MainStack.Navigator screenOptions={{
      headerShown: false
    }}>
      <MainStack.Screen name="Information Overload!" component={HomeScreen} />
      <MainStack.Screen name="Details" component={DetailsScreen} />
    </MainStack.Navigator>
  );
}

function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator mode="modal" headerMode="none">
        <RootStack.Screen name="Main" component={MainStackScreen} />
        <RootStack.Screen name="MyModal" component={ModalScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default App;
