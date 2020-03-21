import React, {
	useState,
	ComponentPropsWithoutRef,
	useRef,
	useEffect,
} from 'react'
import Animated, {
	Transitioning,
	Transition,
	TransitioningView,
	Easing,
} from 'react-native-reanimated'
import firebase from 'firebase/app'
import ControlledPhoneAuth from './PhoneAuth'
import ControlledConfirmPhone from './ConfirmPhone'
import { Appbar, Button } from 'react-native-paper'
import { empty } from '../../utils/empty'
import { useDoormanTheme } from '../../hooks/use-doorman-theme'
import { CommonScreenProps } from '../types'
import { useCallback } from 'react'
import { StyleSheet, Platform, Dimensions, View } from 'react-native'
import { useAuthFlowState } from '../../hooks/use-auth-flow-state'
import { useTimingTransition, bInterpolate } from 'react-native-redash'

type Props = {
	onCodeVerified?: ComponentPropsWithoutRef<
		typeof ControlledConfirmPhone
	>['onCodeVerified']
	// tintColor?: string
	phoneScreenProps?: Omit<
		ComponentPropsWithoutRef<typeof ControlledPhoneAuth>,
		'onSmsSuccessfullySent' | 'tintColor'
	>
	codeScreenProps?: Omit<
		ComponentPropsWithoutRef<typeof ControlledConfirmPhone>,
		'phoneNumber' | 'tintColor' | 'onCodeVerified'
	>
	/**
	 * Test phone numbers array.
	 *
	 * Example: ['+15555555555']
	 */
	testNumbers?: string[]
	headerProps?: ComponentPropsWithoutRef<typeof Appbar.Header>
	/**
	 * Text that shows in the header bar at the top for the phone auth screen. Default: `Sign In`
	 */
	phoneScreenHeaderText?: string
	/**
	 * Text that shows in the header bar at the top for the code verification screen. Default: `Confirm Number`
	 */
	codeScreenHeaderText?: string
} & CommonScreenProps

export function AuthFlow(props: Props) {
	const { tintColor } = useDoormanTheme()
	const { setCodeScreenReady, ready } = useAuthFlowState()

	const {
		phoneScreenProps = empty.object,
		codeScreenProps = empty.object,
		testNumbers,
		headerProps = empty.object,
		phoneScreenHeaderText = 'Sign In',
		codeScreenHeaderText = 'Confirm Number',
		renderHeader,
		...otherProps
	} = props

	const commonScreenProps: CommonScreenProps = {
		...otherProps,
	}

	const transitionRef = useRef<TransitioningView>(null)
	useEffect(() => {
		if (Platform.OS !== 'web') transitionRef.current?.animateNextTransition()
	}, [ready])
	const transition = useTimingTransition(ready, {
		duration: 400,
		easing: Easing.inOut(Easing.linear),
	})
	const translateX = bInterpolate(transition, Dimensions.get('window').width, 0)

	const renderPhoneHeader = useCallback(() => {
		if (renderHeader === null) return null
		if (renderHeader) return renderHeader({ screen: 'phone' })

		return (
			<Appbar.Header
				{...headerProps}
				style={{ backgroundColor: tintColor, elevation: 0 }}
			>
				<Appbar.Content title={phoneScreenHeaderText} />
			</Appbar.Header>
		)
	}, [renderHeader, headerProps, tintColor, phoneScreenHeaderText])

	const renderCodeHeader = useCallback(() => {
		if (renderHeader === null) return null
		if (renderHeader) return renderHeader({ screen: 'code' })
		return null

		return (
			<Button
				style={{ marginTop: 50 }}
				onPress={() => setCodeScreenReady(false)}
			>
				back
			</Button>
		)

		return (
			<Appbar.Header
				{...headerProps}
				style={{ backgroundColor: tintColor, elevation: 0 }}
			>
				<Appbar.BackAction onPress={() => setPhoneNumber('')} />
				<Appbar.Content title={codeScreenHeaderText} />
			</Appbar.Header>
		)
	}, [
		renderHeader,
		headerProps,
		codeScreenHeaderText,
		tintColor,
		setCodeScreenReady,
	])

	// return (
	// 	<View style={styles.container}>
	// 		<>
	// 			<ControlledPhoneAuth
	// 				// renderHeader={renderPhoneHeader}
	// 				renderHeader={null}
	// 				{...commonScreenProps}
	// 				{...phoneScreenProps}
	// 				onSmsSuccessfullySent={() => {
	// 					// setPhoneNumber(phoneNumber)
	// 					setCodeScreenReady(true)
	// 				}}
	// 				tintColor={tintColor}
	// 				testNumbers={testNumbers}
	// 			/>
	// 		</>
	// 		<Animated.View
	// 			style={{
	// 				opacity: transition,
	// 				...StyleSheet.absoluteFillObject,
	// 				transform: [{ translateX: ready ? 0 : 1 }],
	// 			}}
	// 		>
	// 			<ControlledConfirmPhone
	// 				{...commonScreenProps}
	// 				{...codeScreenProps}
	// 				tintColor={tintColor}
	// 				renderHeader={renderCodeHeader}
	// 				onCodeVerified={async info => {
	// 					if (props?.onCodeVerified) props?.onCodeVerified?.(info)
	// 					else {
	// 						const { token } = info
	// 						if (token) {
	// 							// sign the user in
	// 							await firebase.auth().signInWithCustomToken(token)
	// 						}
	// 					}
	// 				}}
	// 			/>
	// 		</Animated.View>
	// 	</View>
	// )

	return (
		<Transitioning.View
			ref={transitionRef}
			transition={
				<Transition.Together>
					{/* <Transition.Out type="fade" durationMs={100} /> */}
					<Transition.Change interpolation="easeInOut" />
					<Transition.In type="fade" />
				</Transition.Together>
			}
			style={styles.container}
		>
			{!ready ? (
				<>
					<ControlledPhoneAuth
						// renderHeader={renderPhoneHeader}
						renderHeader={null}
						{...commonScreenProps}
						{...phoneScreenProps}
						onSmsSuccessfullySent={() => {
							// setPhoneNumber(phoneNumber)
							setCodeScreenReady(true)
						}}
						tintColor={tintColor}
						testNumbers={testNumbers}
					/>
				</>
			) : (
				<>
					<ControlledConfirmPhone
						{...commonScreenProps}
						{...codeScreenProps}
						tintColor={tintColor}
						renderHeader={renderCodeHeader}
						onCodeVerified={async info => {
							if (props?.onCodeVerified) props?.onCodeVerified?.(info)
							else {
								const { token } = info
								if (token) {
									// sign the user in
									await firebase.auth().signInWithCustomToken(token)
								}
							}
						}}
					/>
				</>
			)}
		</Transitioning.View>
	)
}

AuthFlow.Phone = ControlledPhoneAuth
AuthFlow.Confirm = ControlledConfirmPhone

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
