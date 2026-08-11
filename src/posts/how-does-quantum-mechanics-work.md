---
title: How does Quantum Mechanics work?
subtitle: The most complete non-mathematical explanation on the web
nutshell: "This article is a tangible, intuitive intro to quantum mechanics – the way I wish it had been explained to me. It avoids equations & jargon in favor of visual explanations & analogies, yet it is 100% scientifically accurate, to the best of my ability. It starts with two unintuitive (yet foundational) facts about the quantum realm, then applies them in the context of 3 famous quantum mechanical experiments, each revealing more of the profound weirdness of the universe as we know it."
toc: qm-toc.html
img_subdir: qm
img_on_homepage: quantum-background-sm.html
published_on: 2025-11-01
layout: post
css: quantum
js: [post, quantum]
tags: [posts]
published: false
---



{ #introduction }

I’ve spent a few years trying to piece together quantum mechanics, and this article is the result of my work. More than anything, I’ve desired to understand and convey the *ideas* of quantum mechanics. The equations, the terminology – those are only interesting to me so far as they tell about the *inner lives* of atoms and electrons and photons. Basically, I want to be able to explain this stuff with my hands.

{% include img.md, src: "feynman.mp4", alt: "Richard Feynman explaining physics with his hands", caption: "This is what your hands should do when you explain physics. Richard Feynman, our patron saint 🫶", width: "600px" %}

Unfortunately, this is a taller order for quantum mechanics than any other area of science. In quantum mechanics, we have equations that work *extremely well*. But we aren’t sure what they *mean*. We aren’t sure, for instance, if what we do *mathematically* corresponds directly to what happens in reality – or if the math simply arrives at the same result, even though reality is doing something very different under the hood.

In any other area of science, you could just look a little closer and determine what’s really going on. But quantum mechanics *is* the description of what happens when you try to “look a little closer” at photons and atoms and such.

The results are so wild, they’d make for bad fiction.

So if we want to explain quantum mechanics with our hands, we have to make an allowance here – nature may not look exactly like what I’m about to describe! But it certainly arrives at the same results. You can ponder the implications shortly. Physicists have; no consensus has emerged.

One other side-note before we begin: I’m avoiding the standard terminology of quantum mechanics until the final section. I feel that using someone else’s jargon is a way to import someone else’s thinking – which has its uses, but quantum mechanical jargon is so laden with odd connotations and historical baggage that, in my opinion, it’s a hindrance to the beginner. So, to get you up-to-speed with the rest of the world, this piece ends with a hefty glossary tying everything you’ll learn to the “official” terminology. But before that, look out for metaphors and visual explanations that favor clarity over precision.

(Physicists, you’ve been warned 😉)

OK, enough pre-amble. Let’s dive right in.

As far as I can tell, basically *all* of the weirdness of QM is due to *two simple facts*. Neither is intuitive in everyday life, but they’re the foundation of the quantum:

1. Probabilities can cancel
2. Particles can split into many “phantom copies” of themselves

Let’s talk about each of those.



## Probabilities can cancel {data-ordinal="I." #probabilities-can-cancel}

This probably sounds like an arcane mathematical fact, but the implications are wild. Bear with me.

In quantum mechanics (QM), we *do* use normal (or “classical”) probability sometimes – but the majority of the time, we’re thinking in a sort of special quantum probability, which has a unique property: *probabilities can cancel*.

“So you’re saying something can have a -12% chance of happening?”

Kind of! That’s a very useful first approximation.

“OK. But what does it *mean* for something to have a -12% chance of happening?”

For one, it means it cancels out something that has a (positive) 12% chance of happening.

“That’s ridiculous. A 25% chance of drawing a spade cancels a -25% chance of drawing a club!?”

Your intuition is correct – that’s not quite how it works. For these special quantum probabilities to cancel, they have to be probabilities of *the same event happening*. Because when we have two ways for the same event to happen, we *add* the probabilities of the ways.

Take, for example, dice. Say you roll two dice and count the total dots. How many ways are there to roll a 3? There are two ways:

1. The first die is 1 and the second die is 2
2. The first die is 2 and the second die is 1

So the probability of rolling a 3 is the probability of (A) plus the probability of (B).

But now imagine probability (A) is the *negative* of probability (B). That means the two probabilities will add to zero. And *that* would mean… *you would never roll a 3*!

“That’s weird.”

Yes.

Also, if you roll each die individually, they’ll both come up with 1’s and 2’s normally. 12% and -12% look the same when you’re not required to add them together. But if you need to add the probabilities together – as you do when *one event can happen in multiple ways* – then some strange stuff happens.

“Like rolling a pair of dice all day long and never rolling a 3?”

Exactly! And, good news: that’s like half of the weirdness of quantum mechanics right there. It’s about what *doesn’t* happen.

In fact, here’s a hack for understanding QM: if you ever hear about a weird quantum result, simply rephrase it in terms of what *doesn’t* happen, and then rephrase what doesn’t happen in terms of the multiple ways that it *could* happen adding to 0.

The double-slit experiment – which is perhaps the most famous quantum experiment of all time (and we’ll talk about it in-depth shortly) – fits this mold perfectly. You may’ve seen it before, but in case you haven’t, it’s where you shoot particles (e.g. photons, electrons, etc) one at a time through 1 or 2 very small, very close together slits. The particles that make it through the slit(s) hit a screen on the far side. When you add a second slit, the pattern they make becomes unexpectedly more complex.

<div class="double-wide">
    <div class="double-wide__item">
        {% include img.md, src: "single-slit-results.png", width: "350px", caption: "<p>This is expected (more or less).</p><p>When you shoot the photons through a slit, they mostly go straight through, with some bending left or right a bit.</p>", alt: "" %}
    </div>
    <div class="double-wide__item">
        {% include img.md, src: "double-slit-results.png", width: "350px", caption: "<p>This is NOT expected.</p><p>Upon adding a second slit, the pattern suddenly changes to alternating light/dark areas. Why would the photons NOT hit some areas?</p>", alt: "" %}
    </div>
</div>

This unexpectedly complicated pattern is usually phrased in terms of what *happens*: “a crazy pattern!”

But let’s rephrase this in terms of what *doesn’t* happen.

“Photons don’t land in certain areas?”

Yes. And now let’s rephrase that in terms of the multiple ways it *could* happen. What are the multiple ways that a photon *would* reach one of those dark bands?

“Uh, either going through the left slit or going through the right slit?”

Yes. Which means the probability of it going through the left slit vs. going through the right cancel out.

“Uhh… Didn’t you say the photons are shot one at a time though?”

Yes.

“How could a *single* photon travel both paths and cancel itself out!?”

That’s a great lead-in.



## Multiple phantom copies {data-ordinal="II." #phantom-copies}

The second weird yet generative insight about QM is that things (photons, atoms, etc) seem to have the ability to split into many “phantom copies” of themselves.

I say “phantom copies” because they’re never observed directly.

“So why talk about them at all?”

Because they do leave a mysterious – and important – trace of their existence. I’ll explain in a minute. But first, I want to state, as succinctly as possible, how these phantom copies work:

***Whenever particles lose contact with the outside world, they split into phantom copies that trace out every possible thing the particles could do. However, upon looking, you find each particle in only one state.***

Weird, huh?

Let’s look at a simple example: *an atom emitting a photon*.

It’s possible to put an atom in a state where it’s all but certain to emit a photon within the next fraction of a second. But if the atom and photon are isolated enough from the outside world – say, in the center of a very large vacuum chamber – then there’s some amount of time during which we could not, even in principle, say where the photon is. During that time – even if it’s only a millionth of a second – the photon splits into phantom copies that trace out every possible path the photon *could* take. Specifically:

1. We don’t know the *direction* the photon leaves the atom, so we need phantom copies going *all possible directions*
2. We don’t know *when* the photon leaves, so we need phantom copies leaving at *every possible time*

And, while this will complicate things, and we will return to it later, it’s worth mentioning now:

1. We also need phantom copies of the *atom*, one for each possibility of *when* it jumps down an energy level (which it does when the photon is emitted)

{% include qm/emission.html %}

<p class="caption">Note: I’m only displaying SOME of the photon phantom copies. In reality, they’d cover the surface of the illustration!</p>

You’ll notice the bulk of these phantom photons leave *early* (rather than later) and *horizontally* (rather than vertically). Exactly *why* is specific to the type of atom and the exact configuration of its electrons – but for now, just understand this: ***some outcomes are more likely than others***.

For now, let’s clarify these rules of how phantom copies work.

### “Lose contact with the outside world”

Quantum mechanics says that if we aren’t *currently* detecting the state of some particle – and couldn’t, even in theory, determine its state – then, however brief that duration of isolation is, we need to think of phantom copies doing *every possible thing* the particle could do.

This is a bit of a mindset shift.

First, it forces you to admit you don’t, in a general sense, *know the state of a particle*. Maybe you know…

1. A photon was emitted from an atom *around* time x
2. The photon later hit a sensor *at* location y

But between those two data points, there’s no way to “just keep your eye on the photon”.

If it were a bird, sure. Enough photons bounce off the bird and hit your eyeballs that you can continuously *see* the bird.

But a *photon*? Other photons just pass right through it![^3] To reliably get a second photon to interact with the first, the second would need so high an energy, the first would veer far off course. The better you know where it *just was*, the worse you know where it’s *going*!

[^3]: Except in certain high-energy situations

So in between these brief, specific moments of knowledge about a particle’s state, quantum mechanics pushes you towards saying the path of the particle is *not even a well-defined concept*. It’s all mysterious phantom copies, doing every possible thing the particle could do!

### “Every possible thing the particle could do”

This framing raises a question. What *are* all the things that these phantom copies do?

For starters, for any result that you might observe, there’s a phantom copy doing that thing.

Perhaps more shockingly, there are phantom copies doing things that are *never physically observed* – e.g. particles hitting the blank spots on the back wall of a double-slit experiment, or photons moving faster or slower than the speed of light. (I will explain why you don’t *see* these things shortly)

But in general, any measurable property of a particle or group of particles is a dimension in which these phantom copies can vary. Here’s a fuller list to give you a better idea:

<div data-render-sidenote-in-place="true">

| Condition | Examples |
|-----------|----------|
| Anytime a particle could take **different paths**[^4] | <ul><li>An electron goes through a slit vs. hits a wall</li><li>An atom hits another atom vs. flies past it</li><li>A photon bounces off glass vs. goes through it</li><li>A photon bounces in one direction vs another[^5]</li></ul> |
| Anytime a particle could be somewhere at **different times** | <ul><li>A radioactive atom could emit various particles at different possible times[^6]</li><li>An atom with excited electrons could emit a photon at different possible times</li><li>A particle could travel to a spot faster or slower[^7]</li></ul> |
| Anytime a particle could have **different properties** | <ul><li>The spin of a particle – e.g. proton, neutron, electron, etc. (changed by certain magnetic fields, particle collisions, etc.)</li><li>The polarization of a photon (changed by light hitting certain types of crystals, etc.)</li><li>The energy levels of an atom’s electrons (changed by bombarding it with other particles)</li><li>The rotational speed of a molecule (changed by collisions)</li><li>The amount of vibration between the nuclei of a molecule</li></ul> |
| Other | <ul><li>Electrons in a tiny superconducting wire could travel clockwise or counterclockwise</li></ul> |

</div>

[^4]: The equations of QM don’t allow us to say the *particle* takes any one path. Instead, between the moments of “losing contact” and “regaining contact”, the particle is *only* phantom copies doing every possible permutation of things. As to the nature of the phantom copies, that’s up for debate, and something we’ll talk about in [Interpretations](#cocktail-party).

[^5]: At the everyday level, photons bounce off at the same angle they hit at (“angle of incidence = angle of reflection”). But in QM, phantom copies shoot off at every possible angle. That being said, the phantom versions bouncing at exotic angles cancel each other out, and we only observe the angle of incidence equaling the angle of reflection. For more, [read this book](https://amzn.to/42Vgm3p){target="_blank"}.

[^6]: For example, a radioactive tritium atom will, at some point, emit an electron and an antineutrino. Even though it has a 50% chance of doing this in any given 12.3-year span, you need to account for the possibility of it happening at *every possible moment*

[^7]: At the everyday level, photons travel at the speed of light, c. But in QM, phantom copies can travel faster or slower. That being said, the phantom versions at different exotic speeds always cancel each other out, and we only observe photons moving at the speed of light. For more, [read this book](https://amzn.to/42Vgm3p){target="_blank"}.

That being said, there still has to be *some* uncertainty that generates these phantom copies. If a rotating molecule has zero probability of anything bumping it, the rotating molecule won’t have phantom copies spinning at different speeds. But as soon as it’s possible that it *might* get jostled, then you’ve got phantom copies to consider.

And what jostles the molecule? Phantom copies of other particles, of course! The whole thing is multiplicative.

A single particle – e.g. an electron – traveling through space is *easy* to visualize.

{% include qm/traveling-electron.html %}

You’re *most* likely to see it at a certain point, with the probability decreasing as you spread out.

But as soon as you add a second particle, it’s *far* tougher to visualize.

You need to consider not just every phantom copy from two particles, but every *combination* of phantom copies. This becomes too much to visualize cleanly.

So, I’ll just note this for now, and we’ll return to it in the third experiment: when multiple particles are involved, it’s easier to visualize entire phantom *timelines* rather than simply phantom *copies*.

{% include img.md, src:"possible-branches-of-quantum-particle-collision.png", caption: "", alt:"" %}

As a minor spoiler alert, this is why it’s so hard to simulate quantum systems on computers. For every new particle you *add*, the possibilities you need to keep track of *multiply*. Today’s supercomputers can only handle a small molecule on a good day.

Fortunately, there’s a saving grace. Despite the ungodly multiplication of possible scenarios, as soon as the system makes contact with the outside world – that is, *you* – you find that only *one* scenario actually happened.

Let’s talk about that.

### “You find each particle in only one state”

Whenever you look at a particle (and by “look”, I mean “interact with in some way in order to determine its state”), *you only ever see it in one state*. All those other phantom copies are gone forever. Which state will you see? As best we know, it’s totally random. From all the phantom copies, it’s as if God just picks one out of a hat. But even if we don’t know *which* state we’ll see, we can figure out the *probability* of seeing a particular state.[^8]

[^8]: In theory, anyhow. In practice, this is wildly complicated without simplifying assumptions.

This, by the way, is how *cancellable probabilities* and *phantom copies* come together.

Each phantom copy has a probability of being the one that we see. But it’s not a *normal* probability, with a value between 0 and 1. It’s a *special quantum probability*, which can sometimes cancel.

And when does it cancel? When two phantom copies end up in the *exact same state*, but with *equal and opposite* probabilities.

Here is the analog with classical probability. Read down each column.

| Classical probability | Quantum mechanics |
|-----------------------|-------------------|
| When there are multiple ways… | When there are multiple phantom copies… |
| For an event to happen… | That end up in the same state…[^9]{data-render-sidenote-in-place="true"} |
| Each way has a probability of happening… | Each phantom copy has a special quantum probability of being found in that state… |
| And if you add them together… | And if you add up the special quantum probabilities for each of the indistinguishable phantom copies… |
| You get the total probability of the event. | You get the total quantum probability of the event – which can be 0 – and is directly related to the classical probability of the event |

[^9]: The same position at the same time with the same properties

Before we go on, I want to take a moment and say: this is kind of *it*. We will dive into how this process looks in a few specific scenarios, but as outlined above, this *is* the underlying strange process of QM. We have only unsatisfactory guesses as to what such an odd process *means* about how the universe works. But the rest of this article is *unpacking* this core idea, rather than introducing new similarly large ideas.

Anyhow, this should be a “scales falling off your eyes” moment with respect to a few things I mentioned earlier:

> I say “phantom copies” because they’re never observed directly.
>
> “So why talk about them at all?”
>
> Because they do leave a mysterious – and important – trace of their existence.

The trace of their existence is when they cancel out and certain events do not happen.

Or:

> Perhaps more shockingly, there are phantom copies doing things that are never physically observed – e.g. particles hitting the blank spots on the back wall of a double-slit experiment, or photons moving faster or slower than the speed of light. (I will explain why you don’t see these things shortly)

The events never observed are times when two or more ways in which those events could occur have special quantum probabilities that add up to zero.

Before we look at specific experiments, I want to hammer home one point that’s perhaps the most common *misunderstanding* of QM when scientists explain it to a lay audience. Don’t worry; it’s half review 😉



## “Multiple phantom copies” and “I don’t know” are different {data-ordinal="III." #phantom-vs-unknown}

So, to review: any time a photon, electron, atom, molecule, set of molecules, etc. could do *any number of possible things*, you can think of multiple “phantom copies” doing *all* of those possible things. However, if you could, *even in theory*, know what actually happened, you’ll only ever find *one* thing happened. The phantom versions disappear with hardly a trace.

You might be thinking this sounds like the world’s fanciest way of saying “You don’t know what happened. Then you found out”.

But it is not! It 100%, absolutely is *not*.

There are 2 reasons why “multiple phantom copies” and “I don’t know” are different:

1. Phantom copies that end up in the same state can **cancel each other out** (If you merely *don’t know* something, there’s no cancelling involved)
2. As long as the phantom copies remain isolated enough so one outcome is not distinguishable, you can (carefully) **modify the probability** of various outcomes (not always, but sometimes)[^10]

[^10]: And technically is true of some classical probability distributions as well. If you blindly throw a paper airplane north, then blow a fan east-to-west across the direction of throwing, *you’ve modified the probability distribution of where you’ll expect to find the paper airplane*. QED! That being said, the quantum mechanical version is much more shocking than something this mundane.

The first of these is the easiest to understand, and if it’s the only thing you get out of this article, that’s totally fine. The second reason is more subtle, and I’ll introduce it via analogy below.

Now, if you’re still with me, let’s talk about 3 classic QM experiments.

The goal here is to build intuition for what the constituent particles of reality spend all of their time doing. Ideally, you want these results to feel not surprising. Accordingly, you may need to re-read these sections a couple of times. But, once you’re there, congrats – you truly grasp the basics of how the smallest building blocks of the universe work!

Let’s get started 😎



## Experiment 1: the double-slit experiment {data-ordinal="IV." #double-slit}

The double-slit experiment is the most famous quantum mechanics experiment of all time. And with good reason! It’s a striking result, impossible to explain *without* quantum mechanics – yet fairly straightforward to understand with it.

Recall that the central mystery is how the addition of a second slit creates such a complex pattern on the backstop, even as you shoot one particle at a time towards the slits.

<!-- The doc reuses its combined one-slit/two-slit frame here. These are the same two panels
     §I already ships, shown again without their captions — it's a recap, not a new claim. -->
<div class="double-wide">
    <div class="double-wide__item">
        {% include img.md, src: "single-slit-results.png", width: "350px", alt: "One slit: the particles land in a single broad band on the far wall." %}
    </div>
    <div class="double-wide__item">
        {% include img.md, src: "double-slit-results.png", width: "350px", alt: "Two slits: the particles land in several sharp bands separated by gaps." %}
    </div>
</div>

Our hack for understanding QM results is to reframe them not as something that *does* happen, but instead as something that mysteriously *doesn’t* happen. Then we look for 2+ ways that it *could’ve* happened, and we find how the special quantum probabilities of the different ways sum to 0.

OK, so, in the double-slit experiment, here’s how that breaks down:

<table class="header-column">
    <tbody>
        <tr>
            <td>What event mysteriously doesn’t happen?</td>
            <td>A particle hits a certain point on a screen (“x”)</td>
        </tr>
        <tr>
            <td>What are the 2 (or more) ways it could happen?</td>
            <td>
                <ul>
                    <li>The particle goes through the left slit, then hits x</li>
                    <li>The particle goes through the right slit, then hits x</li>
                </ul>
            </td>
        </tr>
        <tr>
            <td>What is the quantum probability of each way?</td>
            <td>The probability oscillates at the frequency of the photon, meaning that if the two paths differ by a half a wavelength (or 1.5, 2.5, etc.), the probability of seeing the photon at that point is zero</td>
        </tr>
    </tbody>
</table>

“HOLD UP. Did you just say the probability… oscillates?”

Yeahhh. About that.

### How quantum probabilities work

When I said probabilities *cancel* in QM, it’s not as simple as “0.5” cancels with “-0.5”. That’s only part of the story. Truthfully, these special quantum probabilities aren’t *a* number, they’re *two* numbers. They’re – and I almost hate to say this – *two-dimensional probabilities*.[^11] Yes, it’s as weird as it sounds. No, we don’t know what it means. Sorry.

[^11]: Technically, they’re complex numbers – there’s a real and imaginary component. So while “2-dimensional” is true, it’s not the full story. Complex numbers naturally allow for _rotation_, which is a property we’ll see shortly.

{% include img.md, src: "classical-probabilities-vs-quantum-amplitudes.png", width: "467px", alt: "Left: a number line from 0 to 1. Right: a filled disc of radius 1, spanning -1 to 1 on both axes.", caption: "Classical probabilities can be anywhere on the line from 0 to 1 (inclusive). Special quantum probabilities can be anywhere on or within a circle of radius 1. WUT." %}

For classical probabilities, we just think of them as a *number* – e.g. “0.1” or “0.482”.

But for these special quantum probabilities, it’s easiest to think of them as an *arrow* (i.e. a vector) – an arrow that starts at the origin and extends to some point on or within a circle of radius 1. Technically, we could achieve the same ends with x and y coordinates, but the arrow helps us think in terms that are more convenient for our purposes: *length* and *angle*.

{% include img.md, src: "quantum-probability-angle-and-length.png", width: "300px", alt: "An arrow from the centre of a pale disc, with its LENGTH labelled along the shaft and its ANGLE labelled on an arc swept from the horizontal." %}

Let’s chat briefly about each.

First, ***length***. This one’s easy. The length of our little arrow of *quantum* probability is related to the *actual* probability of the event.[^12] The longer the arrow, the greater the probability of the event it represents. This is true no matter what direction the arrow is pointing.

[^12]: More specifically, the classical probability of an event is the *square* of the length of the quantum probability. Why? Once again, this is a mystery of the highest order.

Second, ***angle***. The angle of a quantum probability is something that has no analogue in classical probability – in fact, by itself, it doesn’t have a direct physical meaning at all! It simply changes how multiple quantum probabilities *add together*.

When do you add arrows of quantum probability together? Just like classical probability, you add probabilities together when you want to find the *total* chance of something that can happen in *multiple* ways.

To add arrows, simply connect them tip-to-tail. Depending on how aligned the directions are, two e.g. equal size arrows can do anything from *double in length* to *cancel out entirely*!

<div class="double-wide">
    <div class="double-wide__item">
        {% include img.md, src: "similar-arrows-add-constructively.png", width: "350px", caption: "Multiple arrows pointing the SAME direction add to a longer arrow", alt: "Two arrows pointing much the same way, added tip-to-tail into a longer one." %}
    </div>
    <div class="double-wide__item">
        {% include img.md, src: "opposite-arrows-add-destructively.png", width: "350px", caption: "Multiple arrows pointing OPPOSITE directions add to a shorter arrow – or cancel entirely", alt: "Two arrows pointing roughly against each other, added tip-to-tail into a much shorter one." %}
    </div>
</div>

Also, it’s worth reiterating here: *each arrow represents a probability*. Every single one for the rest of this article. They’re all just quantum probabilities. Strange and multidimensional, not just a number from 0 to 1. But, in many ways, these quantum probabilities work just like the classical probabilities we’re used to. So, every time you see an arrow in the rest of this article, you can double-check your understanding by asking “what quantum probability does this arrow represent?”

One other notable feature of these quantum probabilities – at least for our purposes today – is that they have a tendency to spin around the origin. Sometimes, they spin over time. Sometimes, they spin as you look at different points in space. Sometimes both!

In fact, the spinning is so important that my visualizations will sometimes ignore arrow length entirely – for instance, when I use a color on the color wheel to represent an angle. Ignoring length is fine for our purposes, since the relevant arrows getting added often have the same length anyways, but physicists keep careful track of all of it.

{% include img.md, src: "quantum-probability-visualizations.png", width: "600px", alt: "An arrow pointing up and to the right, beside a colour wheel with a yellow dot marking the matching angle.", caption: "2 o’clock and yellow represent the same quantum probability in these visualizations" %}

When the two arrows have the same length, the important dynamic to remember is *equal-and-opposite cancels*. Here are two ways I’ll show that:

{% include img.md, src: "equal-and-opposite-cancel.png", width: "358px", alt: "Two opposite arrows summing to zero, and below them a yellow and a blue colour wheel summing to zero.", caption: "If an event has two equal and opposite probabilities of occurring, that event will never happen. This will be visualized with opposite-pointing arrows, or opposite colors on the color wheel." %}

Now you have some background on these special quantum probabilities. Let’s look at how this works in the context of the double-slit experiment.

### Quantum probabilities over space

Let’s build things up from the simplest possible example – a single particle (like an electron or photon), zipping through space.

If you were to look at a series of points along a line emanating from the particle’s starting position, you’d find that the special quantum probability of finding the particle at various points along the line *spins*, so to speak.

{% include img.md, src: "two-visualizations-of-amplitude-for-finding-particle-along-straight-path.png", width: "600px", alt: "The same straight path drawn twice: once with a corkscrewing arrow turning along it, once as a line running through the full rainbow.", caption: "The special quantum probability of finding a particle at some point along a path “spins”." %}

It’s worth being super clear on *what* is doing the oscillating here. It’s *not* a property of the particle that spins. Rather, it’s a *probability* that spins (classical probabilities can only grow or shrink – but quantum probabilities, being 2-D, can spin). Specifically, it’s the quantum probability of finding a photon at a particular point, measured for a series of points along a straight line. And yes, this paragraph is highly unintuitive. Unfortunately, it’s pretty fundamental to how QM works, so re-read as necessary.

Now I should say that there’s no *direct* way to measure the special quantum probability of a particle appearing at a certain point. And frankly, it’s hard to measure the *classical* probability of something happening. You have to run a bunch of trials and assume you’re getting closer and closer to some underlying value.

But the spinning of a quantum probability *isn’t even picked up by repeated trials* per se. Remember: the classical probability is tied to the *length* of the arrow – which isn’t meaningfully changing.[^13] The *direction* of the arrow – which *is* changing – only comes into play when arrows are added together.

[^13]: I should also add that the length of the quantum probability arrow slightly decreases over the length of the path, for inverse square law-related reasons.

So to see any quantum weirdness at all, you need *two* phantom copies to end up in the exact same place, so their arrows can be added together. And to see *complete cancellation* (i.e. something that mysteriously doesn’t happen), the phantom copies’ arrows of quantum probability need to be equal and opposite.

Fortunately, the distance it takes for the quantum probability to rotate 360° *is* simply the wavelength of the photon used in the experiment (or, for electrons or atoms, it’s not as neat – but in all cases, it’s related to the particle’s *momentum*).[^14]

[^14]: Namely, it’s inversely proportional to the particle’s momentum. More momentum means denser rotations in space.

That means that, to get two phantom copies to cancel each other out – as they do when their arrow representations are equal and opposite – one has to travel exactly one half of a wavelength farther than the other, and end in the same spot.

Let’s see how that looks.

### Quantum probabilities & the double-slit experiment

First, I should say that one does not *require* phantom copies to travel in straight lines. They could loop and swoop every which way! But as far as this experiment is concerned, every zigzagging path *does* cancel out, due to a happy accident/“accident” of the math.

That leaves only paths composed of straight lines that we need to worry about.

{% include img.md, src: "double-slit-types-of-phantom-copies.png", width: "386px", alt: "The double-slit setup seen isometrically, with three labelled paths: one hitting the first wall, one changing direction at a slit, and one going straight through.", caption: "Only straight-line paths matter for the double-slit experiment. And any particles that hit the first wall don’t affect the results, so we ignore those too." %}

So let’s just look at what happens on the back sensor.

If the two paths are the same length – e.g. for the very middle spot on the sensor – then the photons arrive with their arrows pointed in the same direction. Those arrows add to an even bigger arrow – and therefore, the *highest* likelihood of the photon arriving at that location relative to others.

<!-- These three stills are rendered from the widget below rather than drawn beside it, so
     they cannot drift from it. Regenerate with tools/double-slit-stills/render.sh. -->

{% include img.md, src: "double-slit-paths-aligned.png", width: "700px", alt: "The two paths meet at the centre of the far wall. Both arrows point the same way, and the total is a long arrow." %}

For a spot on the screen just to the *right* of the center, the left path is slightly *longer*, and the right path is slightly *shorter*. This means the quantum probability arrow of the left path will be a little more advanced, and the right path won’t advance as much. They’ll be slightly out of sync, and only add to a moderately larger arrow – representing a *moderate* probability of the photon landing at that spot.

{% include img.md, src: "double-slit-paths-partial.png", width: "700px", alt: "The two paths meet just right of centre. The arrows are a quarter turn out of sync, and the total is a middling arrow." %}

Finally, if you take a spot even farther to the right, the difference in left/right path lengths will increase further. When the path difference is exactly half a wavelength, the quantum probability arrows for the two paths will be pointed in opposite directions, and they will add to zero. These are the dark bands at which the photon never lands!

{% include img.md, src: "double-slit-paths-cancelled.png", width: "700px", alt: "The two paths meet farther right. The arrows point in exactly opposite directions, and the total is a dot — zero." %}

Continue on to the right, and the pattern repeats!

Here’s an interactive widget to play around with the variables of the double-slit experiment to get a feel for how things work.

{% include qm/double-slit-paths.html %}

Or, if we simply look at how long the resultant arrow is at every single point, we can visualize the entire display at once.

{% include qm/double-slit-pattern.html %}

If you noticed the similarity to ripples on a pool, your thinking is in line with many scientists before you. You can recreate this same pattern with a double-slit wall set up in a pool of water.

{% include img.md, src: "water-ripples.png", width: "600px", alt: "Overlapping ripples in shallow water over a rocky streambed, crossing each other in a regular interference pattern." %}

There is a deep similarity in the underlying math, though let’s be precise. It’s not that the *particle* itself is a wave. Rather, the *quantum probability* is wave-like, allowing for even (the phantom copies of) a single particle to recreate the same patterns we see in the waves created by trillions of particles.

The last thing I want to draw your attention to is how profoundly strange this all is. It’s very difficult to describe how this double-slit experiment might work without some notion of the particle exploring different paths and those paths interacting with each other. Again, maybe this *isn’t* how reality operates. Maybe it only arrives at the same results. But as we’re about to see, there’ll be much more for that theory to explain.

Because experimentally, this is all very real. Double-slit experiments (and related multi-slit setups) have been performed with everything from photons and electrons, all the way to beastly 2,000-atom oligoporphyrin molecules. The specifics vary, but we see the same style of pattern again and again.

{% include img.md, src: "tonomura-electron-double-slit.png", width: "500px", alt: "A black field scattered with white dots from individual electrons, clustering into vertical bands.", caption: "A double-slit type experiment result performed with electrons", image-credit: "<a href='https://sites.ifi.unicamp.br/aguiar/files/2014/02/tonomura-1989.pdf' target='_blank'>Tonomura et al (1989)</a>" %}

{% include img.md, src: "juffmann-molecule-multi-slit.png", width: "400px", alt: "Orange fluorescent dots from individual dye molecules on a dark field, gathering into vertical stripes.", caption: "A multi-slit experiment performed with 58-atom dye molecules", image-credit: "<a href='https://arxiv.org/pdf/1402.1867' target='_blank'>Juffmann et al (2014)</a>" %}

Anyhow, if you’re with me this far, congrats! You now have a very tangible understanding of how the most famous experiment in all of quantum mechanics works.

Next, we’ll see how these “phantom copies” don’t just take different paths in space, but can take on different states that even a perfectly stationary particle could be found in.

Let’s look at an example of that, by way of analogy.



## Interlude: the parable of the coin {data-ordinal="V." #parable-of-the-coin}

*Uncertainty in QM isn’t like a coin toss, whose result you don’t know in midair. Rather, it’s like a loaded coin whose loadedness is changeable until revealed.*

Imagine for a second that I give you a very special coin. It does something weird when you follow certain steps:

1. Turn it heads up
2. Flip it, catching it on your wrist
3. Without looking at what it landed on, immediately flip it again
4. Now uncover it
5. It’s tails, 100% of the time

If I showed you this, you’d probably think I was using sleight of hand. But say I gave you the coin, you followed the same steps, and you got the same result – tails every time. What do you do next?

Make some easy money on bar bets!?

Nah, sorry, we’re scientists here. You inspect the coin, find it’s normal, and then see what happens if you look after just *one* flip!

And when you do many trials of flip-once-then-look, you find that the result is 50% heads, 50% tails. Just like a normal coin.

So what’s up with two-flips-then-look being 100% tails? You try flipping twice before looking again, just for kicks. And it’s 100% tails again. Fine, so *that’s* still weird.

You guess the obvious next thing to do is flip it *three* times before looking. You do this many times, and find it is once again, 50% H, 50% T. Hmmm.

Now you’re curious… What about *four* flips before looking? What will happen then? You check, and indeed, it’s *heads* every time.

So here’s what we’ve got so far:

| # of flips before looking | Result |
|---------------------------|--------|
| 1 | 50-50 |
| 2 | 100% tails |
| 3 | 50-50 |
| 4 | 100% heads |

“OK, stupid coin, I’ll bite,” you think to yourself, as you embark on a series of 5-flips-then-look and 6-flips-then-look trials. Lo and behold, you find:

| # of flips before looking | Result |
|---------------------------|--------|
| 5 | 50-50 |
| 6 | 100% tails |

And let’s say you go as far as necessary to convince yourself that indeed, this pattern loops endlessly. Despite the existential vertigo you have from handling a magic artifact, you feel like some progress is being made. There are essentially four “states” the coin can be in. And it just cycles through them:

{% include img.md, src: "bloch-coin.png", width: "400px", alt: "A ring of four states — 100% heads at the top, 50-50 on each side, 100% tails at the bottom — joined by four FLIP arrows running clockwise." %}

This is actually pretty curious. You notice that your map says “50-50” twice. Now *all* coins are 50-50 when you flip them once. But *this coin* has two distinct scenarios where it’s 50-50. And they’re subtly different. Not because of what you observe directly (they both yield half heads, half tails), but because of where they *lead to*. In one 50-50 state, if you don’t look and flip again, you’ll *definitely* get HEADS. And in the other 50-50 state, if you don’t look and flip again, you’ll *definitely* get TAILS. So the coin – or something – must have some memory, some way to track, some deeper variable for where it’s at in this cycle.

Hm.

Then I make one more off-hand comment to you: “You should try waiting 2.41 seconds after the first flip”.

Just given how your day’s going so far, you decide to take my advice. You start the coin at heads, flip it in the air, keep it covered for 2.41 seconds (you’re very accurate with timing), and then look.

Heads. And then tails. And then heads again… After enough trials, you convince yourself it’s 50-50. You’re about to say, “Hey, that doesn’t change anything – it’s still 50-50”, when you realize that this coin has *two* 50-50 states. If you wait after flipping it once… is it in the *same* 50-50, or the other one?

So you decide to flip it once, wait 2.41 seconds, then flip it *again*, and *THEN* look. And guess what – it’s heads every time!

So you tentatively draw a new path in your diagram:

{% include img.md, src: "bloch-coin-2.png", width: "400px", alt: "The same ring of four coin states, now with a WAIT 2.4 S arrow crossing the middle from the left 50-50 state to the right one." %}

And then you wonder: if you go from left 50-50 (“L”) to the right 50-50 (“R”), *can you do the reverse*?

Your most reasonable guess is that by going to R, *then waiting 2.41 seconds*, you’ll end up at L.

So you try it. You turn the coin to heads, flip it, catch it, wait 4.82s this time, flip it again – and then look. Tails. You do it again, and get tails again. And again. Etc.

Your new theory: if you go L and wait 2.41 seconds, you’ll end up at R. But if you’re at R and wait 2.41 seconds, you’ll end up at L.

You once again sketch another arrow in your burgeoning magic coin diagram:

{% include img.md, src: "bloch-coin-3.png", width: "400px", alt: "The same ring, now with two WAIT 2.4 S arrows running in opposite directions between the left and right 50-50 states." %}

I appear again and ask if you’ve considered winning some bar bets with coin tricks. You say yes. I scoff and say you should use it to break RSA encryption and make billions. “Though you’d need to be able to read the flip without looking at it…” I mumble.

“Huh?” you say. But you ignore the comment. This day has been weird enough already.



## Experiment 2: the Ramsey experiment {data-ordinal="VI." #ramsey-experiment}

In the quantum world, a lot of things act like the coin in the example above – atoms, for instance. I’ll explain how in a second.

But first, I want to talk about *why* I used the analogy of the coin. There are 2 main reasons:

1. Because it makes it more visceral how *strange* it is that small systems really act this way (and if you really *feel in your bones* the weirdness of the coin, it’ll help you remember the weirdness of QM)
2. Because it illustrates the second major reason that “many phantom copies” is different from “I don’t know”

What’s that reason? Well, it’s what I started the parable of the coin with:

*Uncertainty in QM isn’t like a coin toss, whose result you don’t know in midair. Rather, it’s like a loaded coin whose loadedness is changeable until revealed.*

Do you understand how the loadedness of this coin is changeable as long as I haven’t looked yet? By some combination of (a) flipping it again and (b) waiting, you can change the coin’s results distribution however you’d like.

When you flip a *normal* coin on your wrist and cover up the result, *you don’t know what it is*.

But with the “magic” coin, it wasn’t the case that you merely didn’t know whether it was heads or tails. Upon flipping-but-not-looking, the coin actually entered a whole new state – something not captured by “heads or tails”.

In any case, many quantum systems work very similarly to the coin. A simple one is the *electron energy state of an atom*.

What’s an electron energy state? Well, the electrons around the nucleus of an atom have multiple separate energy levels they can be found in. This is actually kind of counterintuitive. You’d naively expect they could have a *range* of energies. But not so! They’re either at *specific* energy level A, or B, or C, or whatever. For our purposes, higher energy levels tend to mean the electron is, on average, found farther from the nucleus.

Today, we’ll only deal with two consecutive energy states – which I’ll call “ground” and “excited”.

<div class="double-wide">
    <div class="double-wide__item">
        {% include img.md, src: "ground-state-electron.png", width: "350px", caption: "A “ground state” electron in an atom has LESS energy, and, for our purposes, stays closer to the nucleus.", alt: "A false-color image of a hydrogen atom's electron cloud: a single compact blob, brightest at the centre." %}
    </div>
    <div class="double-wide__item">
        {% include img.md, src: "excited-state-electron.png", width: "350px", image-credit: "<a href='https://www.newscientist.com/article/mg21829194-900-smile-hydrogen-atom-youre-on-quantum-camera/' target='_blank'>New Scientist</a>", caption: "An “excited state” electron in an atom has MORE energy, and is typically farther afield from the nucleus.", alt: "A false-color image of a hydrogen atom's electron cloud in an excited state: a bright core surrounded by a separate outer ring." %}
    </div>
</div>

These electron energy states map over to the coin analogy from the previous section. But instead of flipping the coin to transition between states, we beam the atom with a perfectly calibrated blast of photons.

A version of the Ramsey experiment using a rubidium atom won the [Nobel prize in 2012](https://www.nobelprize.org/prizes/physics/2012/popular-information/){target="_blank"}. So we’ll use that going forward.

| Coin analogy | Atom (e.g. rubidium in Rydberg n=50 state) |
|--------------|------|
| Heads | Lower electron energy state (“ground”) |
| Tails | Higher electron energy state (“excited”) |
| Flipping the coin | A precise blast of photons at 51.09 GHz (microwave radiation) |
| The 50-50 states | Two “phantom copies”; one in each energy state |
| Waiting 2.41 seconds | Waiting 9.8 picoseconds (differs by atom) |

So here’s what our “map” looks like for this rubidium atom:

{% include img.md, src: "bloch-rubidium.png", width: "400px", alt: "The coin ring redrawn for a rubidium atom: ground state at the top, excited at the bottom, “Plus” and “Minus” at the sides, joined by MICROWAVE PULSE arrows and two WAIT 9.8 PS arrows across the middle." %}

The “ground” and “excited” electron states replace “heads” and “tails”, microwave pulses take the place of coin flips, and the waiting time between 50-50 states is much, *much* shorter (this picosecond duration can be arbitrarily lengthened in the lab, but for the sake of simplicity, we’ll continue referencing this one stupidly short value). Also, I’ve also renamed the 50-50 states to “Plus” and “Minus”.[^15]

[^15]: Those already familiar with quantum computing will recognize these as the |+⟩ and |−⟩ states on the Bloch sphere.

For our little rubidium atom, if you pulse it with a precise blast of microwave radiation, and then look at its energy state, it’s ground 50% of the time, excited 50% of the time.

Again, if you did not know quantum mechanics, you might think, “Ah, we’ve found the blast of radiation that makes it 50-50 ground or excited, and we simply don’t know which it is until we look!”

But if, instead of looking, you keep it isolated, wait precisely 9.8 picoseconds, and then blast it again, you’ll see that it’s 100% *ground* state.

{% include img.md, src: "bloch-rubidium-path-to-ground.png", width: "400px", alt: "The same map with one route traced in blue: a microwave pulse to “Plus”, a 9.8 picosecond wait across to “Minus”, and a second pulse back up to the ground state." %}

Alternatively, if you wait twice as long between blasts – a whole 19.6 picoseconds – the subsequent second blast will reveal an *excited* state atom every single time.

{% include img.md, src: "bloch-rubidium-path-to-excited.png", width: "400px", alt: "The same map with a longer route traced in blue: a pulse to “Plus”, two 9.8 picosecond waits across and back, and a second pulse down to the excited state." %}

On one hand, you’re probably like “Yeah, that’s exactly how the magic coin works, NBD”. But on the other hand, it means the magic coin is actually real (!)

Blast the atom once, it’s 50-50. But if you don’t look, and instead blast it again – with very precise timing – you can choose whether you want it to appear 100% ground or 100% excited.[^16] No coin on earth works that way.

[^16]: You were probably wondering, so I’ll say it: yes, you can also get intermediate distributions of ground/excited by waiting *other* amounts of time.

Now the core idea of this article is that quantum weirdness is because of (1) cancelling probabilities and (2) phantom copies. So let’s write out this experiment in that framework:

<!-- A pipe table rather than raw HTML, because [^17] sits in a cell and a footnote marker
     inside an HTML block renders literally. The two classes markdown-it-attrs can't put on a
     table (it lands them on a row) come from .qm-wide-table in quantum.scss instead. -->
<div class="sticky-column-table-wrapper qm-wide-table" data-render-sidenote-in-place="true">

|  | Double-slit experiment | Ramsey experiment |
|--|------------------------|-------------------|
| What splits into phantom copies? | A particle (e.g. a photon) | An atom |
| How do the phantom copies differ from each other? | Location | Energy level |
| How many relevant phantom copies are there? | Potentially infinite | 2 (for all intents and purposes[^17]) |
| What’s the event that has multiple ways in which it could happen? | Landing at a specific point on the far screen | Being found at a specific energy level (e.g. ground or excited) |
| What are the (two) ways the event could happen? | <ul><li>Phantom copy goes through left slit to that point</li><li>Phantom copy goes through right slit to that point</li></ul> | <ul><li>The first blast excites the atom/phantom copy and it stays excited through the second blast</li><li>The first blast doesn’t excite the atom/phantom copy, but the second blast does</li></ul> |
| How do you calculate the special quantum probability of each way? | The probability oscillates with a wavelength related to the momentum of the particle (for a photon, it’s simply its wavelength) | The probability oscillates at a frequency proportional to the energy of the atom |
| How do the two ways the event could happen sometimes add to zero probability? | If the two paths to a particular point on the wall differ by 0.5 (or 1.5, 2.5, etc) wavelengths, the phantom copies will arrive exactly out of sync and cancel each other, meaning the particle will never be seen there | If the second microwave blast happens when the quantum probabilities of each copy are exactly out of sync, it will lead to the two excited phantom copies cancelling, and only ground state atoms being seen |

</div>

[^17]: At one moment, there will perhaps technically be 4 – but *conceptually*, we’re concerned with two phantom copies.

The last two steps are new – we haven’t covered those yet.

To see how it all fits together, here’s a widget that walks step-by-step through the experiment, using the visualization of cancellable phantom copies:

{% include qm/ramsey.html %}

Two details the widget states without justifying: why that first blast leaves the atom exactly 50-50,[^18] and why the ground copy formed from the excited one comes out with its arrow flipped.[^19]

[^18]: As the diagram from the previous section implies, a longer blast means a higher percentage chance of finding the atom in the excited state. This is true all the way up to double the calibrated blast, when the atom is in the “100% excited” state, and then the probability starts decreasing again towards 100% ground state.

[^19]: It’s a rule that when an excited-state copy gets split, the ground-state copy flips its arrow.

    This is true of all similar quantum systems, not just the electronic energy state of an atom.

    But why would a 6 o’clock excited-state copy make a 12 o’clock ground-state copy? What does it mean?

    To be honest, I don’t know. It does appear to be more about mathematical bookkeeping than about the physical properties of electron energy states. If you were given an atom in “state 1” (but not told whether “1” meant ground-state or excited-state), no amount of (a) microwave blasts, (b) waiting, or (c) reading out the state as “1” or “2” would allow you to figure out whether “1” was ground or excited. It’s just sort of a mathematical truism that when state 2 spawns back into state 1, the arrow flips.

    If I do find a more satisfying answer – whether tangible or mathematical – I will update this article.

And here is the whole sequence in one picture, if you’d rather see it laid out end to end than step through it.

{% include img.md, src: "ramsey-step-by-step-timeline.png", width: "700px", alt: "The four stages of the Ramsey experiment left to right: microwave blast #1 splits one ground-state atom into a ground and an excited copy; the wait turns their arrows apart; blast #2 splits each of those into two more; and in the result the two excited copies cancel while the two ground copies add, leaving a single ground-state atom.", caption: "The same five steps the widget walks through, end to end. The excited copies (red) cancel; the ground copies (blue) add." %}

In the double-slit experiment, there were *potentially infinite* phantom copies with *identical* properties taking *different paths*.

In the Ramsey setup, there are *two* phantom copies with *different* properties *located at the same point in space*.

Next, let’s take the final conceptual step for this article. Let’s examine what happens when there are *two* particles that each split into phantom copies.



## Experiment 3: the Hong-Ou-Mandel experiment {data-ordinal="VII." #hong-ou-mandel}

The Hong-Ou-Mandel experiment is perhaps the simplest experiment that forces us to reckon with how QM deals with *multiple* particles. Since our goal is to be able to visualize things as tangibly as possible, I’ll keep the lede front and center:

> when multiple particles are involved, it’s easier to visualize entire phantom *timelines* rather than simply phantom *copies*

This will make more sense shortly.

In the Hong-Ou-Mandel experiment, we have two photon sources, two sensors, and a beam splitter.

What’s a beam splitter? It’s a half-mirror. When a photon hits it, one of two things happen, each with equal probability:

* The photon passes through (like glass)
* The photon reflects (like a mirror)

Here’s what that looks like. You can click the photon sources to get a feel for how things work.

{% include qm/hong-ou-mandel.html %}

Maybe you’re wondering, “what happens if I fire both photon sources at the same time?” Well, that is the experiment!

First, try predicting how that would go.

(Yeah, I know. This is a quantum mechanics article. You probably think there’s going to be something tricky – and you’re right! But we haven’t covered enough for you to know how the trickiness will go, so just work it out as if QM didn’t exist)

A few moments of thought will convince you that there are 4 scenarios with equal likelihood:

{% include img.md, src: "hong-ou-mandel-4-possible-paths.png", width: "700px", alt: "Four small copies of the beam-splitter setup in a row, numbered 1 to 4, each showing one combination of the two photons passing through or bouncing." %}

1. The left photon passes through AND the right photon passes through
2. The left photon passes through AND the right photon bounces
3. The left photon bounces AND the right photon passes through
4. The left photon bounces AND the right photon bounces

Because (1) and (4) both lead to *both* sensors going off, that means the breakdown of results would be:

* 50% of the time, both sensors will go off once
* 25% of the time, the left sensor will go off twice
* 25% of the time, the right sensor will go off twice

But that is, of course, *not* what happens.

In order to see what happens, I need to give you two additional pieces of information. Here’s the first: *when a phantom copy of a photon reflects off a beam-splitter, its special quantum probability rotates by 90°*.[^20]

[^20]: This 90° is less a specific law of nature than a number forced by mathematical bookkeeping. Sometimes you’ll see different rules about pass-through vs reflecting, but they’ll yield the same result that we’re about to see.

If we’re visualizing the angle with color, then you’ll notice the reflected copy has a color that’s 90° further ahead than the copy that passes through.

{% include img.md, src: "hong-ou-mandel-amplitude-on-reflection.png", width: "700px", alt: "Both photon paths drawn as rainbow lines through the beam splitter. At one sensor the arriving colour is red; at the other it is green, a quarter turn of the colour wheel ahead." %}

What does this *mean*? Again, for classical probability, we can only compare probabilities by whether they’re larger or smaller. “Probability x is 25% smaller than probability y”. But for quantum probabilities, we have a new method of comparison: how out of sync they are, as measured in degrees.[^21] “Quantum probability x is 90° out of phase with y”. The out-of-syncness doesn’t affect the classical probability of seeing the particle there, only how that phantom copy cancels with other identical copies at that location.

[^21]: In practice, radians.

Now, contrary to how we worked through the double-slit experiment, we’re not going to predict the Hong-Ou-Mandel experiment by drawing rainbow lines. Why not? Well, remember what these rainbow lines are: they’re the quantum probability of seeing the particle at that point, as measured at every point along the path. *They’re the probability of a specific event happening*.

In our case, since there are two photons, we’re actually interested in *two events happening*. Sensor A detecting a photon (or two) AND sensor B detecting a photon (or two). And there’s no clean way to show all the possibilities with little rainbow lines towards the sensors.

But we can use the same spirit. Rather than visualizing the quantum probability of a single event at different points in *3-D space*, we can simply calculate the quantum probability of multiple sub-events co-occurring directly.

In other words, we’ll take the 3 end results we’re interested in:

1. Sensor L goes off twice
2. Sensor R goes off twice
3. Sensor L and sensor R each go off once

…and we’ll figure out a quantum probability of each occurring.

{% include img.md, src: "hong-ou-mandel-3-end-results.png", width: "700px", alt: "Three empty panels headed SENSOR L GOES OFF 2X, BOTH SENSORS GO OFF 1X and SENSOR R GOES OFF 2X, each asking “QUANTUM PROBABILITY?”" %}

There is one way for sensor L to go off twice (Photon L reflects AND photon R passes through).

There is one way for sensor R to go off twice (Photon L passes through AND photon R reflects).

But there are *two* ways for R and L to each go off once:

1. Photon L passes through AND photon R passes through
2. Photon L reflects AND photon R reflects

{% include img.md, src: "hong-ou-mandel-3-end-results-from-4-photon-paths.png", width: "700px", alt: "The same three panels, now filled in: one setup under each outer heading, and two under the middle one.", caption: "In quantum mechanics, we can never tell which of the middle two events actually happened – as long as the results are totally indistinguishable" %}

Now, to figure out which end result happens, we simply need to find the quantum probability of each one.

The first and last scenarios are slightly easier. The middle scenario – in which each sensor goes off once – involves adding two possible ways that could happen. But let’s start with the easy part.

So, take the first scenario, in which the left sensor goes off twice. There are two things that need to happen for the left sensor to go off twice: one photon passes through AND the other photon reflects. To figure out the quantum probability of such a scenario, we need to *multiply* (a) the special quantum probability of a phantom copy passing through with (b) that of it reflecting.

Why? Because whenever we want to know the probability of *A and B happening*, we multiply the probabilities of A and B together.[^22] For instance, the probability of a person being born male in May is the probability of being male (~0.5) multiplied by the probability of being born in May (~0.083). Our special type of quantum probability is no different than classical probability here.

[^22]: As long as they’re independent events

But how do you “multiply” two arrows together? Math actually provides a very straightforward answer here: you *add* the angles and *multiply* the lengths.[^23]

[^23]: This is simply the geometric interpretation of multiplying complex numbers together.

{% include qm/amplitude-multiplication.html %}

In the context of the Hong-Ou-Mandel experiment, it’s even easier still. Since all paths end with the same arrow *length*, we don’t have to get precise there.[^24] And since the exact *direction* of the arrows don’t matter – only their relative directions compared to each other – we can treat those pretty loosely too.

[^24]: Technically, you must rescale the length of the arrows so that the sum of all possibilities is 1.

Given this, we can say that e.g. the quantum probability of the left sensor going off twice looks like this:

{% include img.md, src: "hong-ou-mandel-amplitude-of-left-sensor-going-off-twice.png", width: "614px", alt: "The setup with both photons arriving at the left sensor, beside the arrow equation PASS THROUGH times REFLECT equals a result pointing straight up." %}

It’s a slightly shorter arrow in a different direction. Ok, fine.

The same is true of the right sensor going off twice:

{% include img.md, src: "hong-ou-mandel-amplitude-of-right-sensor-going-off-twice.png", width: "614px", alt: "The setup with both photons arriving at the right sensor, beside the arrow equation REFLECT times PASS THROUGH equals a result pointing straight up." %}

Where things differ is when each sensor goes off once. In that case, we have two possible timelines that each involve two concurrent events. So we will do two arrow multiplications, then add those results together.

First, when *both* phantom copies pass through the beamsplitter:

{% include img.md, src: "hong-ou-mandel-amplitude-of-both-photons-passing-through.png", width: "614px", alt: "The setup with both photons passing straight through, beside the arrow equation PASS THROUGH times PASS THROUGH equals a result pointing right." %}

And finally, when *both* phantom copies reflect at the beamsplitter:

{% include img.md, src: "hong-ou-mandel-amplitude-of-both-photons-reflecting.png", width: "614px", alt: "The setup with both photons reflecting, beside the arrow equation REFLECT times REFLECT equals a result pointing left — the exact opposite of the previous one." %}

Now when we sum those, we find the most devious of quantum results…

{% include img.md, src: "hong-ou-mandel-amplitude-of-coincidences.png", width: "547px", alt: "BOTH PASS THROUGH plus BOTH REFLECT: a right-pointing arrow added to an equal left-pointing one, giving a dot. Below, the two setups themselves add to zero." %}

Zero! The paths cancel. The timeline in which both photons reflect has a quantum probability equal and opposite to the timeline in which both pass through.

Therefore, it never happens that each sensor goes off once.

No matter how many times you shoot both photon sources simultaneously, both photons go right or both photons go left. They never split.

It’s a bit crazy, no?

And yet it’s reality.

{% include img.md, src: "jachura-hong-ou-mandel.png", width: "448px", alt: "Sixteen numbered frames from a photon-counting camera, each showing green dots in either the Port V row or the Port H row, but almost never in both.", caption: "Both photons hit either one sensor (“Port V”) or the other (“Port H”), never both. Except frame 8. Experimental error! – making photons indistinguishable is hard.", image-credit: "<a href='https://opg.optica.org/ol/fulltext.cfm?uri=ol-40-7-1540' target='_blank'>Jachura and Chrapkiewicz (2015)</a>" %}

In these experiments of quantum mechanics, a theme starts to emerge. The stuff the universe is composed of, when no one’s looking, endlessly splits into copies of itself in every permutation of possible paths and properties. The whole system is accounted for in an odd type of probability, a probability that spins (trillions of times per second, even). It’s a probability that cancels too, and while anything that can happen one way might occur, some things that can occur many ways are simply never seen.

With that ends my main exposition of QM. However, one task remains. I have rigorously avoided all QM terminology and jargon up to this point. If you are ever to read about or speak with someone about QM, they will have no idea what you’re talking about with phantom copies and cancelling probabilities.

So let’s translate the very tangible, physical picture thus far into the language the rest of the world uses for the concepts and ideas above.



## How to discuss QM at a cocktail party {data-ordinal="VIII." #cocktail-party}

A half-dozen pieces of QM jargon probably set my understanding of this stuff back by *years*. Many of the words we’re stuck with raise more questions than answers. Hence my description above, which focused on tangible explanations and metaphors.

But now, it’s time to learn how everyone else talks about this stuff. If you’ve heard some of the terms below before, I hope you have a renewed appreciation for the strange physicality of this science.

Let’s begin.

### Amplitude

I’ve talked a lot about “special quantum probabilities” in this article, but I should correct myself. In QM, there is a sort of thing *like* a probability that can cancel, but it’s called an “amplitude” (or a “probability amplitude”). Mathematically, not only can it be negative (whoa!), but it’s actually a *complex number* (double whoa!).

(The spinning arrows of length ≤1 we’ve been using? Those are all amplitudes)

Whenever you hear the term “amplitude”, you can always just think “special quantum probability that can cancel” and you’ll be totally fine. The two ideas are totally equivalent.

You use the term “amplitude” the same way you’d use the word “probability” too. Instead of saying “there’s a probability that the photon will do X”, you’d say “there’s an *amplitude* that the photon will do X”.

For what it’s worth, to get the classical probability of some result, you do the following:

1. Take the probability amplitude for each separate way the result could occur
2. Add them together
3. Take the length of the result (the *magnitude* of the *amplitude* 🧐)
4. Square it

Why *square* it? No one knows, but it probably says something very deep about reality. Let me know if you find out![^25] 🤷‍♂️

[^25]: You should also alert the Nobel Prize committee.

### Superposition

Whenever I’ve talked about “multiple phantom copies” of a particle or system, that’s what physicists call a *superposition*. If you’ve read the least bit of QM, you probably figured that one out 😉

The biggest misconception about superposition is that it kinda sounds like a fancy way of saying “I don’t know what state the thing is in”. But remember: that’s wrong for two reasons:

1. Amplitudes in a superposition can *cancel*, meaning a certain event simply may never be observed (these weird cancellations aren’t explainable by “I don’t know what state the thing is in”)
2. You can *tweak* a superposition (in ways you can’t tweak “I don’t know what state the thing is in”), which we saw in the parable of the coin and Ramsey experiment

Any property of a particle or a group of particles that can vary can be in superposition. In general, spatial superpositions get the most airtime (“the particle is everywhere!” 👻), except for in quantum computing, where we really carefully put things in a superposition of just two states (like the rubidium atom in both its ground and excited energy state).

But as long as a particle or system is isolated from the outside environment, it can enter a superposition of every *possible* state it could be in. And when you sum up all those possibilities, well, we have a word for that…

### Wavefunction

The mathematical expression of the probability amplitude of every possible state of the system is called the *wavefunction*.

(It’s kind of like a probability distribution, but with *amplitudes* instead of classical probabilities)

So if you e.g. close your eyes and throw a ball, you could make a probability distribution of seeing it in different places when you open your eyes. At every point in space, you’d have a certain probability of seeing the ball there.

In QM, if you e.g. close your eyes and throw an electron (I’m only half-joking), you’d have to work out the calculations in *amplitudes*, not *probabilities* (because of weird cancellations, remember?). But at every point in space, you’d have a certain amplitude of seeing the electron there. And that mathematical expression is the wavefunction!

So, next question: why “wave”?

OK, remember how amplitudes tend to *oscillate*? (i.e. the arrows *rotate?*) For the double-slit experiment, we saw them oscillate over different points in space. In the Ramsey setup, they oscillated over time. Mathematically, something oscillating over space and time *already* *is a wave*. You just need to look at the full picture to see it.

<!-- The video replaces the doc's still of the same scene. Re-tune or re-export it with
     tools/wavefunction-studio (see its README) — params.json there reproduces this exact
     clip. -->

{% include img.md, src: "wavefunction-in-3d.mp4", controls: true, width: "700px", alt: "A three-dimensional landscape of a quantum wavefunction passing through a double slit. A rainbow-striped hill travels toward a barrier, part of it bounces back, and the rest fans out beyond the two slits into an interference pattern of ripples.", caption: "The wavefunction of a particle going through a double-slit. The color represents the ANGLE of the amplitude at that point. The height represents the LENGTH of the amplitude at that point. Cancellations between multiple paths lead to wave-like crests and troughs of probability. Note that most probability “bounces back” rather than passing through the slits." %}

Sadly, this organic technicolor sloshing is going to come to a screeching halt. The multitude of possibilities represented with the wavefunction will be replaced with a single reality – as soon as it becomes possible to tell the state of the particle. However, the jargon for this is a bit odd…

### Measurement/Observation

Ohhh boy. This one’s a doozy.

So a superposition is a very delicate thing. If a particle or system is in a superposition, and it subsequently becomes *possible* to tell – *even in theory* – what the *actual* state of the particle or system is, then the superposition immediately disappears and the thing is only in one state. All those phantom copies vanish without a trace.[^26]

[^26]: Except for, of course, the fact that the amplitudes can cancel each other out – the clue that got us *into* this mess in the first place.

An air molecule in Earth’s atmosphere might make it all of a nanosecond before it slams into another air molecule, and the multitude of tiny paths its wavefunction describes over that nanosecond get collapsed into a single position.

Nonetheless, *historically*, we were mostly concerned about superposition collapsing in the context of laboratory experiments. Unfortunately, we’ve inherited, as the terms of art for what collapses a wavefunction, *measurement* or *observation*.

This means if you hear someone say “a photon measured the state of the system”, they’re not claiming the photon is conscious, nor are they saying the lil’ corpuscle of light is performing science. Instead, they’re saying a photon interacted with the thing that was in superposition such that it’s theoretically possible to glean some information about the system’s state. And the wavefunction has now collapsed.

This unfortunate jargon has also led some scientists to say things that sound far more mystical than were probably intended – e.g. “The very presence of an observer changes the results of the experiment”, etc.

But that’s only the *second*-most famous problem with quantum measurement…

### The Measurement Problem

So this whole bit about “when you look, all the phantom copies – *except for one* – disappear” probably feels a little weird. Why just one? You’re saying nature just *throws out* a huge number of things it just did?

When a system is isolated from the broader environment, its wavefunction (which, remember, gives an amplitude for every possible state the system could be found in) evolves over time in a very mathematically clean way. It’s deterministic, it’s reversible. Mathematicians love it.

However, when *measurement* happens, it’s the opposite. We go from some number of possible states – two, twenty, a million, infinity – *to just one*. And even worse, that one appears to be chosen at random. There’s no way to mathematically “roll back the clock”. And of course, because it’s random, you can’t predict it in advance either.

Scientists have felt this tension very acutely for a century, and it’s called *the measurement problem*.

This may only hit with the math folks, but it’s basically akin to saying:

(A + B) × C = AC + BC = AC{ .equation }

Why? Because I threw out the AB, that’s why!

Having some sense of the measurement problem will contextualize the next few terms in our glossary.

### Interpretation

Most physics equations map to reality in a pretty straightforward way.

For instance, the equation for the motion of a ball thrown through the air involves all the things you’d intuitively think of that could affect this – the angle and speed of the throw, how much air resistance there is, the pull of gravity, etc.

However, QM is different.

With quantum mechanics, we discovered equations that *predicted* reality stunningly well – we just don’t know what they mean.

And so QM has something that no other part of physics has. It has *interpretations*. Again, these different interpretations all have the same equations and the same predictions.[^27] They’re simply about what those equations *mean*.

<!-- TODO: the doc's footnote 27 is cut off mid-sentence — it reads, in full, “The notable
     exception being “objective collapse” theories, which posit that ”. Trimmed to a complete
     clause here; finish the thought when you get a chance. -->

[^27]: The notable exception being “objective collapse” theories.

In some sense, an interpretation is an answer to the measurement problem.

Let’s look at 2 of the most famous.

### Copenhagen interpretation

This is the default, “textbook” interpretation of QM. Unfortunately, it doesn’t actually do that much interpreting – it sort of just throws its hands up in the air and says “That’s the way it is!”

For instance, if you ask a Copenhagen devotee what it means for an electron to be in a superposition, they’re likely to say the question is meaningless (“you can only ask about the result of a measurement”) or even say the *math* is the real thing (“the electron *is* the wavefunction, nothing more”).

Does this resolve the measurement problem? Not really. It’s simply labelled the “collapse of the wavefunction” – and not really explained in any further detail.

The steelman of this is that the mathematical axioms of QM reference “observing”, but they *don’t actually specify what an “observation” is*. So Copenhagen devotees are merely refusing to indulge in speculation beyond what the math requires.

Well, *some* Copenhagen devotees refuse to indulge in such speculation. It’s worth noting that *others* took the implications of “observation causes the wavefunction to collapse” and just *ran with it*.

{% include img.md, src: "observation-by-what.png", width: "400px", alt: "The “sneaky snek” meme: a goose asks “observation by what?”, then chases a fleeing person while honking “OBSERVATION BY WHAT?”" %}

Observation by what? By conscious entities, of course! This is a nice way to tie in almost any metaphysical system you’d like into otherwise materialist physics.[^28] If true, this has the neat implication that reality is sort of lazily rendered, like a video game that only loads the part of the map nearest you.

[^28]: And, while I’m being somewhat glib about it, it’s impossible to refute. A conscious observer is needed to run an experiment, and they will, by definition, observe the results. Therefore, there’s no experiment that can determine what will happen if no conscious observer observes it.

(Einstein disliked this, famously asking, “Do you really believe the moon is not there when you are not looking at it?”)[^29]

[^29]: This is, of course, an exaggeration. For the moon to be in a superposition of states, it’d have to be completely isolated from the Earth.

So it’s worth noting that, if you meet someone who subscribes to the Copenhagen interpretation, they may be (a) a quantum physicist who cares more about *predicting* reality than *explaining* reality, or (b) Deepak Chopra.

### Many Worlds Interpretation

“Many worlds” is the understatement of the century. It should properly be called something like “infinite parallel universes spawning every femtosecond”.

According to the Many Worlds Interpretation (henceforth “MWI”), there’s not *a* universe in which quantum events happen randomly (God rolling dice, as Einstein famously quipped), but a deterministic *multiverse*, in which every possible event that *can* happen *does* happen – just in different branches.

It’s pretty similar to the “phantom timeline” idea I’ve mentioned above. The MWI take on the double-slit experiment is that, for anywhere one *could* see the particle land, there’s a branch in which the particle did land there. And if you shoot 100 particles through the double slit, the universe splits into every possibility, every time.

{% include img.md, src: "double-slit-branches.png", width: "700px", alt: "One double-slit setup labelled INITIAL SETUP, with arrows fanning down from it to a row of otherwise identical copies — “branches containing all possible results” — each with the particle landing at a different spot on the far wall." %}

Of course, it’s not just quantum mechanics experiments that split the multiverse. The implication is that basically *every* particle interaction does. The roughly 10<sup>80</sup> atoms of the known visible universe are *constantly* spawning an unfathomable number of branches with every collision!

{% include img.md, src: "possible-branches-of-quantum-particle-collision.png", width: "700px", alt: "A branching tree of isometric panels, each showing two particles colliding and scattering at different angles and start times.", caption: "Remember this diagram? Every permutation of possible angles, times, energies, etc. for every collision." %}

If this sounds wild, I’ll grant you that. But in its favor, it is a very clean resolution to the measurement problem. Why does the wavefunction collapse into a single state? It doesn’t! Sure, it *appears* to, here in our branch. But the rest of the wavefunction is still alive and well, spread out across other branches of the multiverse!

But MWI is not a monolith, and proponents debate even some basic ontological questions about branches:

* Are branches discrete, countable things?
* Are there *many* branches, or *infinite* branches?
* Do the new universes branch from existing ones, or did they all always exist?
* If they branch, *when* exactly do they branch? – when we *lose* contact with the particle, or *regain* it?
* Why do the rules of probability for branches have *amplitudes* associated with them? What’s *that* all about?

But one thing all MWIers agree on is that there are an effectively infinite number of copies of *you*. The branch in which you started reading this paragraph will turn into an ungodly number of branches containing slightly different yous – all by the time you finish this paragraph. Then, in even *more* branches, you will go on to live every life that it is physically possible for you to live.

Putting aside the existential vertigo, MWI is perhaps the easiest interpretation to visualize. It’s no coincidence that “phantom timelines” (and, for single particles, “phantom copies”) are so similar to branches in MWI. Two relevant differences: (1) I’ve more or less ignored the measurement problem (i.e. what happens to the non-observed copies) and (2) I’ve consistently described the phantom copies branching off as soon as the particle *loses* contact (many modern MWI proponents believe branches aren’t separate until the particle *regains* contact, a process called “decoherence”).

But if you’re willing to allow branches to separate the moment anything loses contact, then that opens up perhaps the *strongest* argument for *any* interpretation of QM I’ve heard, and that’s from David Deutsch, the godfather of quantum computing.

However, in order to understand his argument, we need to cover the basics of quantum computers. Buckle up! 😎

### Quantum computers

Quantum computers & quantum computing (henceforth: QC) are easiest to explain at the lowest level and the very highest levels. All the stuff in the middle would require another article-length explanation.

The major *low-level* idea behind QCs is: they use *qubits* instead of *bits*.

A bit can be 0 or 1, and “classical” (i.e. normal) computers do all their computation, file storage, and input/output using bits.

A *qubit*, on the other hand, can be 0, 1, or a superposition of 0 and 1.

Given that the #1 *most* common misunderstanding of superposition is it’s just a fancy way of saying “I don’t know”, this sounds a bit like trying to augment your computer with random coin flips. Probably not much alpha there 🤷‍♂️

But you, wizened reader, know that you can perform *operations* on superpositions. Indeed, the whole Ramsey experiment section was on just this. An atom is not like a regular coin; it’s like a *magic* coin, with a sort of state that only *shows* itself in heads and tails, but, *under the hood*, is more complex.

But even that analogy doesn’t make it obvious how QCs offer any advantage over normal computers. To understand *that*, let’s look at our diagram of phantom timelines in the Hong-Ou-Mandel experiment:

{% include img.md, src: "hong-ou-mandel-3-end-results-from-4-photon-paths.png", width: "700px", alt: "The three end results of the Hong-Ou-Mandel experiment again, with two indistinguishable setups under the middle one." %}

Now imagine this. Every time you fire off the photons, you create 4 branches in the multiverse, each with its own amplitude. Since the middle two scenarios have (a) indistinguishable end states, and (b) amplitudes that sum to zero, they cancel. Those branches disappear outright.

If you understand *that*, then you can easily understand the high-level idea behind QC algorithms: you do calculations using a quantum system (photon, atom, etc), then get the branches containing the *wrong* answer to cancel out, such that only the branch with the *correct* answer remains. And if that’s the branch that remains, that’s the branch where you and I will find ourselves!

Since the purpose of this section is to prep you for cocktail party chit-chat, I should say that the most common misunderstanding of QC is emblazoned across the header of the internet’s most popular QC blog, Scott Aaronson’s [Shtetl Optimized](https://scottaaronson.blog/){target="_blank"}:

> If you take nothing else from this blog: quantum computers won’t solve hard problems instantly by just trying all solutions in parallel.

Indeed, while QCs *can* try all solutions in parallel, there’s no guarantee that you’d find yourself in the branch of the multiverse containing the *correct* answer. For that, you need much more cleverness – making QC algorithms *preeetty* complex compared to traditional computer science fare.

Nonetheless, Shor’s algorithm – the most famous QC algorithm – was developed early in the history of QC (1994). It allows for much faster factoring of large numbers than classical computers can achieve, which would notably render many current encryption algorithms useless. Nonetheless, post-quantum cryptographic algorithms *do* exist, and we’ll undoubtedly move to them before the first quantum hacker steals trillions 🤞

Speaking of Shor’s algorithm, this is also related to David Deutsch’s justification for MWI. He asks, and I’m paraphrasing:

> If you were to turn all matter in the entire observable universe into a classical computer that spent billions of years factoring an unimaginably large number, and then you were to do the same calculation almost instantly on a quantum computer that fits on your desk, *where did that second computation happen*?

Deutsch, of course, believes there’s only one answer: quantum computation happens in the multiverse! It happens in the incalculably many branches that are *always* being generated – but that we can sometimes carefully harness to cancel in *juuuust* the right way so that we find ourselves in a branch where the quantum computers are correct.

This is a stunning idea – but he’s far from convinced the rest of the physics community, and in general, the field called “Foundations of Quantum Mechanics” – which deals with *what is happening under the hood* – remains fascinating.

To end our glossary, we’ll switch gears to something much simpler, and more famous.

### Schrodinger’s Cat

This is perhaps the most classic thought experiment in all of QM.

Imagine we have a chamber that is completely sealed off from the outside world, such that its contents can enter a superposition. In that chamber, we place:

* A cat
* A robot with a gun pointed at the cat
* A quantum system with two states (such as a rubidium atom in its ground or excited state)
* A measurement device that can determine the quantum system’s state

The robot puts the quantum system in a superposition. Then, the robot measures its state. If the state is e.g. HIGH, the robot shoots the cat. If the state is LOW, it lets the cat live.

Now, since the whole setup is isolated from us, the whole setup is in a superposition. But it’s an absolutely *wild* superposition, in which there are two possibilities:

* The atom was measured HIGH, the robot shot the cat, and **the cat is dead**
* The atom was measured LOW, the robot didn’t shoot the cat, and **the cat is alive**

Superpositions aren’t just for atoms anymore! They’re also for cats, which have phantom copies that are both alive and well *and* bleeding out on the floor.

Erwin Schrodinger, the OG quantum physicist who discovered the wavefunction, proposed this thought experiment to show just how ridiculous the implications of the theory were. Jokes on him though, nowadays we just kinda go with it. “Yup, cat’s alive and dead. NEXT!”

(Unless you’re a MWI proponent, who says “Yup, cat’s alive in 50% of branches, dead in the other 50%. NEXT!”)

And because I can’t let a good thing go, I’ll mention a third interpretation, called “objective collapse”, which debates whether large macroscopic systems (e.g. a cat) *can* be in a superposition. Perhaps they naturally break down past a certain size! After all, we’ve definitely put some largish molecules into one, but nothing like a cat. And so, they propose, the cat’s maybe/maybe-not death chamber would collapse into a single state well before any robot assassin was reading off the energy state of an atom in there. NEXT!

### And all the rest

QM is not a small field, and trying to do it justice in an intro will always leave stones unturned.

Nonetheless, there are foundational ideas and terms we haven’t covered:

* The Schrodinger Equation
* Wave-Particle Duality
* Quantum tunneling
* Heisenberg’s Uncertainty Principle
* Entanglement

In a sufficiently broad conversation on QM, these will all come up. However, even if this article can’t cover them, you will find them *much* simpler to understand given the tangible model of things we’ve talked about over the last 12,000 words.



## Further reading {data-ordinal="IX." #further-reading}

* [**QED**](https://amzn.to/42Vgm3p){target="_blank"} by Richard Feynman. A layman’s intro to the quantum lives of photons and electrons (called “quantum electrodynamics”, hence the title). Explains how a wide array of common light effects (reflection, refraction, fluorescence, etc) work at the quantum level. Notably, written by the greatest science communicator of all time, Richard Feynman (who also discovered some of this stuff *and* won a Nobel prize for it 😉). Absolutely my most recommended read for those who liked this article.
* [**Quantum Country**](https://quantum.country/){target="_blank"} by Michael Nielsen & Andy Matuschak. A giant 4-part article on QC and QM. Michael Nielsen has (literally) written the textbook on QC, and while he’s one of the world’s best explainers of technical concepts, warning: this piece comes with the full mathematical formalism a practicing physicist would be interested in! Nonetheless, it builds up an understanding of quantum computing – including a quantum search algorithm – from the ground up. Incredibly good.
* [**LessWrong Quantum Sequences**](https://www.lesswrong.com/w/the-quantum-physics-sequence){target="_blank"} by Eliezer Yudkowsky. For those comfortable with math (imaginary numbers, linear algebra), this is a surprisingly accessible introduction to QM. I recall it as being overly-wordy – and pretty smug regarding how MWI was *obviously* the correct interpretation of QM. Nonetheless, a worthwhile read for someone diving in.

Thanks to Abhi Vyas and Matt Favero for their feedback.{ .credits }
