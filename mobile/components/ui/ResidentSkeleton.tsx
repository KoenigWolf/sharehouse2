import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import { Card } from "./Card";
import { Colors } from "../../constants/colors";

export function ResidentSkeleton() {
   const animatedValue = useRef(new Animated.Value(0)).current;

   useEffect(() => {
      Animated.loop(
         Animated.sequence([
            Animated.timing(animatedValue, {
               toValue: 1,
               duration: 1000,
               easing: Easing.inOut(Easing.ease),
               useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
               toValue: 0,
               duration: 1000,
               easing: Easing.inOut(Easing.ease),
               useNativeDriver: true,
            }),
         ])
      ).start();
   }, [animatedValue]);

   const opacity = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
   });

   return (
      <View className="flex-1">
         <Card className="p-4 overflow-hidden">
            <View className="items-center mb-3">
               <Animated.View
                  style={{
                     width: 72,
                     height: 72,
                     borderRadius: 36,
                     backgroundColor: Colors.muted,
                     opacity,
                  }}
               />
            </View>

            <View className="items-center">
               <Animated.View
                  style={{
                     width: "80%",
                     height: 16,
                     borderRadius: 4,
                     backgroundColor: Colors.muted,
                     marginBottom: 8,
                     opacity,
                  }}
               />
               <Animated.View
                  style={{
                     width: "50%",
                     height: 12,
                     borderRadius: 4,
                     backgroundColor: Colors.muted,
                     opacity,
                  }}
               />
               <Animated.View
                  style={{
                     width: "60%",
                     height: 20,
                     borderRadius: 10,
                     backgroundColor: Colors.muted,
                     marginTop: 12,
                     opacity,
                  }}
               />
            </View>
         </Card>
      </View>
   );
}
