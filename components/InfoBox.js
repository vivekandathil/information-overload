import * as React from 'react';
import { View, Text, Button, WebView, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import TouchableScale from 'react-native-touchable-scale';

const colors = {
    green: ['#00F260', '#24FE41'],
    orange: ["#fe8c00", "#f83600"],
    blue: ["#0575E6", "#021B79"],
    purple: ["#4776E6", "#8E54E9"],
    mango: ["#ffe259", "#ffa751"],
}

function InfoBox(props) {
    return (
        <View style={{ margin: 4 }}>
            <TouchableScale>
                <LinearGradient
                    // Button Linear Gradient
                    colors={colors['orange']}
                    style={{ height: props.height, width: props.width || 110, padding: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 5 }} >
                    <Text style={{ fontFamily: 'HelveticaNeue', fontSize: 18, color: 'white', marginBottom: 4, textAlign: 'center' }}>{props.name}</Text>
                    <Text style={{ fontFamily: 'HelveticaNeue', fontWeight: 'bold', fontSize: 16, color: 'white' }}>{props.information + ((props.units === undefined) ? "" : " " + props.units)}</Text>
                </LinearGradient>
            </TouchableScale>
        </View>
    )
}

export default InfoBox;