import * as React from 'react';
import { View, Text, Button, ScrollView, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { Accelerometer, Barometer, Magnetometer, DeviceMotion } from 'expo-sensors';
import moment from "moment";
import SelectInput from 'react-native-select-input-ios'
import MapView from 'react-native-maps';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Ionicons } from '@expo/vector-icons';
import TouchableScale from 'react-native-touchable-scale';

// To upload equation snippets to an S3 bucket
import { RNS3 } from 'react-native-aws3';
import { keys } from './keys.js';

const config = {
  bucket: 'assets-vjk',
  keyPrefix: 'KML_files/',
  region: 'ca-central-1',
  accessKey: keys.s3ID,
  secretKey: keys.s3Secret,
}

// Generate a unique id string to name files uploaded to the S3 bucket
function makeid(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// temperature, barometer
// save coordinates and save to cloud
// set decimal places
// proximity sensor to navigate screen

import InfoBox from './components/InfoBox.js';

const temp = { "coords": { "altitude": 0, "altitudeAccuracy": 0, "latitude": 0, "accuracy": 0, "longitude": 0, "heading": 0, "speed": 0 }, "timestamp": 0 };
const locationInformation = ["altitude", "altitudeAccuracy", "latitude", "accuracy", "longitude", "heading", "speed"]

const colorOptions = [{ value: 'orange', label: 'Orange' }, { value: 'green', label: 'Green' }, { value: 'blue', label: 'Blue' }];
let color = 'orange';

let kmlString = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><LineString><coordinates>\n`;

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

  let timestamp = 0;

  const createKML = async (kml) => {

    try {
      // file:///var/mobile/Containers/Data/Application/D5B3D430-0CDF-4644-97E8-186B04EE4ED7/Documents/ExponentExperienceData/%2540vivekandathil%252Fsensors/
      const uri = (FileSystem.documentDirectory + "tracking.kml");
      FileSystem.writeAsStringAsync(uri, (kmlString + '</coordinates></LineString></Placemark></Document></kml>'));

      // construct a random filename
      const fileName = `tracking_${makeid(8)}.kml`;

      // Construct a file object from the URI, file name, and MIME type for KML
      let file = {
        uri: uri,
        name: fileName,
        type: "application/vnd.google-earth.kml+xml"
      };


      // Upload the snippet to an S3 bucket with a randomized filename
      RNS3.put(file, config).then(res => {
        if (res.status !== 201)
          throw new Error("Failed to upload image to S3");
        console.log(res);
      })


      if (Platform.OS === "ios") {
        await Sharing.shareAsync(uri);
      } else {
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted) {
          await MediaLibrary.createAssetAsync(uri);
        }
      }





    } catch (error) {
      console.error(error);
    }
  };

  React.useEffect(() => {

    const interval = setInterval(async () => {
      timestamp += 1;

      await Location.getLastKnownPositionAsync()
        .then((position) => {

          console.log("currentPosition", position);
          setLocation(position);
          kmlString += `\t\t${position.coords.longitude},${position.coords.latitude},${position.coords.altitude}\n`;


        }).catch((error) => {
          console.log(error);
        });

    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Ask user for permission to access location and constantly update
  React.useEffect(() => {
    isRendered = true;


    (async () => {

      let { status } = await Location.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
      }
      if (isRendered && tracking) {
        Accelerometer.addListener(accelerometerData => {
          setAcceleration(accelerometerData);
        });
        Barometer.addListener(barometerData => {
          setPressure(barometerData);
        });
        Magnetometer.addListener(data => {
          setMagneticField(data);
        });




        setHeading(await Location.getHeadingAsync({}));
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
      <Text style={{ margin: 20, fontFamily: 'HelveticaNeue', fontSize: 24, marginBottom: 4, textAlign: 'center' }}>{moment()
        .format('YYYY-MM-DD hh:mm:ss a')}</Text>
      <View style={{ display: 'flex', width: '90%', marginBottom: 10, marginTop: 10, flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <TouchableScale onPress={createKML}>
          <Ionicons name="ios-cloud-upload" size={35} color="#fe8c00" style={{ marginTop: 6 }} />
        </TouchableScale>
        <TouchableScale onPress={() => setTracking(!tracking)}>
          <Ionicons name={tracking ? "ios-pause" : "ios-play"} size={44} color="#fe8c00" />
        </TouchableScale>
        <TouchableScale onPress={() => navigation.navigate('MyModal')} style={{ marginTop: 2 }}>
          <Ionicons name="ios-settings" size={40} color="#fe8c00" />
        </TouchableScale>
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